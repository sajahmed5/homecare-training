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
): Promise<OrgLearnerRow[]> {
  const [{ data: users }, { data: enrRaw }, { data: certRaw }] =
    await Promise.all([
      supabase
        .from("users")
        .select("id, full_name, email, status, last_seen_at")
        .eq("role", "learner")
        .order("full_name", { ascending: true }),
      supabase
        .from("enrolments")
        .select(
          "user_id, course_id, status, progress, due_date, assigned_at, courses(title, topics(title))",
        ),
      supabase
        .from("certificates")
        .select(
          "user_id, course_id, issued_at, expires_at, courses(title, topics(title))",
        )
        .order("issued_at", { ascending: false }),
    ]);

  // Group enrolments + certificates by learner.
  const enrByUser = new Map<string, Enrolment[]>();
  const assignedByUser = new Map<string, string>(); // latest assigned_at
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
  }

  const certByUser = new Map<string, Certificate[]>();
  const latestByUser = new Map<string, { title: string; date: string }>();
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

/** Certificates issued per week over the last `weeks` weeks (oldest → newest). */
export async function completionsByWeek(
  supabase: SupabaseClient,
  weeks = 12,
): Promise<WeekPoint[]> {
  const now = new Date();
  const msWeek = 7 * 86_400_000;
  const since = new Date(now.getTime() - weeks * msWeek).toISOString();
  const { data } = await supabase
    .from("certificates")
    .select("issued_at")
    .gte("issued_at", since);

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
