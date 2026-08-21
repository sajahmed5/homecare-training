import type { SupabaseClient } from "@supabase/supabase-js";
import {
  learnerStats,
  type Enrolment,
  type Certificate,
  type LearnerStats,
} from "@/lib/learner-data";

export interface OrgLearnerRow {
  id: string;
  name: string;
  email: string | null;
  status: string;
  stats: LearnerStats;
  latestCompleted: { title: string; date: string } | null;
  lastAssignedAt: string | null;
  lastSeenAt: string | null;
  lastRemindedAt: string | null;
  /** Total in-course learning time, seconds (from enrolments.time_spent). */
  timeSpentSeconds: number;
  /** Certificates issued after the enrolment's due date. */
  lateCompletions: number;
}

/** Headline stats count active staff only; deactivated stay in the matrix. */
export const isActiveLearner = (r: OrgLearnerRow) => r.status !== "deactivated";

const DAY = 86_400_000;

/**
 * The two ways of being unseen, kept apart on purpose and defined ONCE here.
 *
 * "Inactive" means signed in at some point, then went quiet — someone to chase
 * about their training. "Never active" means invited but never onboarded at
 * all — someone to chase about signing in, which is a different conversation
 * (and a different email: they still have no password).
 *
 * These used to be spelled out at each call site and had drifted apart: the
 * org pages counted inactive as "has a last_seen_at AND it is stale" while the
 * platform org page counted "no last_seen_at OR it is stale", so one real org
 * showed 0 inactive to its manager and 223 to us under the same label. Import a
 * helper rather than re-deriving either test (issue #22).
 */
export const isInactive30d = (r: OrgLearnerRow, now: number = Date.now()) =>
  !!r.lastSeenAt && now - new Date(r.lastSeenAt).getTime() > 30 * DAY;

/** Invited but never signed in — no last_seen_at at all. */
export const isNeverActive = (r: OrgLearnerRow) => !r.lastSeenAt;

/**
 * A certificate counts as a late completion when it was issued after the
 * enrolment's due date. Both sides compare as YYYY-MM-DD strings (due_date is
 * a date; issued_at a timestamp). No due date = never late.
 */
export function isLateCompletion(
  issuedAt: string,
  dueDate: string | null | undefined,
): boolean {
  return !!dueDate && issuedAt.slice(0, 10) > dueDate;
}

/**
 * Every learner lands in exactly one status bucket, so status counts add up to
 * the learner total (issue #15). Most-urgent wins: overdue beats in-progress
 * beats not-started.
 */
export type LearnerBucket =
  | "overdue"
  | "in_progress"
  | "not_started"
  | "completed"
  | "unassigned";

export function bucketOf(r: OrgLearnerRow): LearnerBucket {
  const s = r.stats;
  if (s.assigned === 0) return "unassigned";
  if (s.overdue > 0) return "overdue";
  if (s.inProgress > 0) return "in_progress";
  if (s.notStarted > 0) return "not_started";
  return "completed";
}

interface JoinedCourse {
  title?: string;
  topics?: { title?: string } | null;
}
function pickCourse(row: { courses?: unknown }): JoinedCourse {
  return (row.courses as JoinedCourse) ?? {};
}

/**
 * Aggregate every learner in the org for the Learners overview. One row per
 * learner with their full training rollup, latest completed course, when they
 * were last assigned training, and when they were last active on the site. RLS
 * scopes all reads to the caller's organisation.
 */
export async function loadOrgLearners(
  supabase: SupabaseClient,
  orgId?: string,
): Promise<OrgLearnerRow[]> {
  // When orgId is given (platform_admin viewing a specific org), scope every
  // read to it explicitly — the platform RLS would otherwise return all orgs.
  let usersQ = supabase
    .from("users")
    .select("id, full_name, email, status, last_seen_at")
    .eq("role", "learner")
    .order("full_name", { ascending: true });
  let enrQ = supabase
    .from("enrolments")
    .select(
      "user_id, course_id, status, progress, due_date, assigned_at, last_reminder_at, time_spent, courses(title, topics(title))",
    );
  let certQ = supabase
    .from("certificates")
    .select(
      "user_id, course_id, issued_at, expires_at, courses(title, topics(title))",
    )
    .order("issued_at", { ascending: false });
  if (orgId) {
    usersQ = usersQ.eq("organisation_id", orgId);
    enrQ = enrQ.eq("organisation_id", orgId);
    certQ = certQ.eq("organisation_id", orgId);
  }
  const [{ data: users }, { data: enrRaw }, { data: certRaw }] =
    await Promise.all([usersQ, enrQ, certQ]);

  // Group enrolments + certificates by learner.
  const enrByUser = new Map<string, Enrolment[]>();
  const assignedByUser = new Map<string, string>(); // latest assigned_at
  const remindedByUser = new Map<string, string>(); // latest last_reminder_at
  const timeByUser = new Map<string, number>(); // summed time_spent seconds
  const dueByUserCourse = new Map<string, string>(); // "user:course" → due_date
  for (const e of enrRaw ?? []) {
    const c = pickCourse(e);
    const list = enrByUser.get(e.user_id) ?? [];
    list.push({
      id: `${e.user_id}:${e.course_id}`,
      course_id: e.course_id,
      status: e.status,
      progress: e.progress,
      due_date: e.due_date,
      assigned_at: e.assigned_at,
      attempt_count: 0,
      completion_count: 0,
      title: c.title ?? "Course",
      topic: c.topics?.title ?? null,
    });
    enrByUser.set(e.user_id, list);
    const prev = assignedByUser.get(e.user_id);
    if (!prev || (e.assigned_at && e.assigned_at > prev)) {
      assignedByUser.set(e.user_id, e.assigned_at);
    }
    const prevReminded = remindedByUser.get(e.user_id);
    if (e.last_reminder_at && (!prevReminded || e.last_reminder_at > prevReminded)) {
      remindedByUser.set(e.user_id, e.last_reminder_at);
    }
    timeByUser.set(e.user_id, (timeByUser.get(e.user_id) ?? 0) + (e.time_spent ?? 0));
    if (e.due_date) dueByUserCourse.set(`${e.user_id}:${e.course_id}`, e.due_date);
  }

  const certByUser = new Map<string, Certificate[]>();
  const latestByUser = new Map<string, { title: string; date: string }>();
  const lateByUser = new Map<string, number>();
  for (const c of certRaw ?? []) {
    const co = pickCourse(c);
    const list = certByUser.get(c.user_id) ?? [];
    list.push({
      id: `${c.user_id}:${c.course_id}`,
      course_id: c.course_id,
      number: "",
      issued_at: c.issued_at,
      expires_at: c.expires_at,
      title: co.title ?? "Course",
      topic: co.topics?.title ?? null,
    });
    certByUser.set(c.user_id, list);
    // certs are ordered issued_at desc, so the first seen is the newest.
    if (!latestByUser.has(c.user_id)) {
      latestByUser.set(c.user_id, {
        title: co.title ?? "Course",
        date: c.issued_at,
      });
    }
    if (isLateCompletion(c.issued_at, dueByUserCourse.get(`${c.user_id}:${c.course_id}`))) {
      lateByUser.set(c.user_id, (lateByUser.get(c.user_id) ?? 0) + 1);
    }
  }

  const now = new Date();
  return (users ?? []).map((u) => {
    const enrolments = enrByUser.get(u.id) ?? [];
    const certificates = certByUser.get(u.id) ?? [];
    return {
      id: u.id,
      name: u.full_name ?? u.email ?? "Learner",
      email: u.email ?? null,
      status: u.status ?? "active",
      stats: learnerStats(enrolments, certificates, now),
      latestCompleted: latestByUser.get(u.id) ?? null,
      lastAssignedAt: assignedByUser.get(u.id) ?? null,
      lastSeenAt: u.last_seen_at ?? null,
      lastRemindedAt: remindedByUser.get(u.id) ?? null,
      timeSpentSeconds: timeByUser.get(u.id) ?? 0,
      lateCompletions: lateByUser.get(u.id) ?? 0,
    };
  });
}

export interface CoverageLearner {
  id: string;
  name: string;
  status: string; // enrolment status or 'not_enrolled'
  completedAt: string | null;
}
export interface CourseCoverage {
  course: { id: string; title: string } | null;
  completed: CoverageLearner[];
  outstanding: CoverageLearner[];
}

/** Who has / hasn't completed one course, across all the org's learners. */
export async function loadCourseCoverage(
  supabase: SupabaseClient,
  courseId: string,
): Promise<CourseCoverage> {
  const [{ data: course }, { data: users }, { data: enr }, { data: certs }] =
    await Promise.all([
      supabase.from("courses").select("id, title").eq("id", courseId).maybeSingle(),
      supabase
        .from("users")
        .select("id, full_name, email")
        .eq("role", "learner")
        .order("full_name", { ascending: true }),
      supabase
        .from("enrolments")
        .select("user_id, status")
        .eq("course_id", courseId),
      supabase
        .from("certificates")
        .select("user_id, issued_at")
        .eq("course_id", courseId)
        .order("issued_at", { ascending: false }),
    ]);

  if (!course) return { course: null, completed: [], outstanding: [] };

  const statusByUser = new Map<string, string>();
  for (const e of enr ?? []) statusByUser.set(e.user_id, e.status);
  const certByUser = new Map<string, string>();
  for (const c of certs ?? []) if (!certByUser.has(c.user_id)) certByUser.set(c.user_id, c.issued_at);

  const completed: CoverageLearner[] = [];
  const outstanding: CoverageLearner[] = [];
  for (const u of users ?? []) {
    const name = u.full_name ?? u.email ?? "Learner";
    const status = statusByUser.get(u.id) ?? "not_enrolled";
    if (status === "completed" || certByUser.has(u.id)) {
      completed.push({ id: u.id, name, status: "completed", completedAt: certByUser.get(u.id) ?? null });
    } else {
      outstanding.push({ id: u.id, name, status, completedAt: null });
    }
  }
  return { course: { id: course.id, title: course.title }, completed, outstanding };
}

export interface WeekPoint {
  week: string; // short label, e.g. "21 Jul"
  count: number;
}

/**
 * Certificates issued per week over the last `weeks` weeks (oldest → newest).
 * Pass orgId to scope to one org (platform_admin); omit to rely on RLS.
 */
export async function completionsByWeek(
  supabase: SupabaseClient,
  weeks = 12,
  orgId?: string,
): Promise<WeekPoint[]> {
  const now = new Date();
  const msWeek = 7 * 86_400_000;
  const since = new Date(now.getTime() - weeks * msWeek).toISOString();
  let q = supabase.from("certificates").select("issued_at").gte("issued_at", since);
  if (orgId) q = q.eq("organisation_id", orgId);
  const { data } = await q;

  const buckets = new Array(weeks).fill(0);
  for (const c of data ?? []) {
    const age = now.getTime() - new Date(c.issued_at).getTime();
    const idx = weeks - 1 - Math.floor(age / msWeek);
    if (idx >= 0 && idx < weeks) buckets[idx] += 1;
  }
  return buckets.map((count, i) => {
    const d = new Date(now.getTime() - (weeks - 1 - i) * msWeek);
    return {
      week: d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
      count,
    };
  });
}
