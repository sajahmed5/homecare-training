import type { SupabaseClient } from "@supabase/supabase-js";
import { expiryFlag, isOverdue } from "@/lib/engine-logic";
import { computeStarTotal } from "@/lib/stars";

export interface Enrolment {
  id: string;
  course_id: string;
  status: string;
  progress: number;
  due_date: string | null;
  assigned_at: string;
  attempt_count: number;
  completion_count: number;
  title: string;
  topic: string | null;
}

export interface Certificate {
  id: string;
  course_id: string;
  number: string;
  issued_at: string;
  expires_at: string | null;
  title: string;
  topic: string | null;
}

export interface LearnerData {
  enrolments: Enrolment[];
  certificates: Certificate[];
  activityDates: Date[];
  readAt: string | null;
  fullName: string | null;
  email: string | null;
}

interface JoinedCourse {
  title?: string;
  topics?: { title?: string } | null;
}

function pickCourse(row: { courses?: unknown }): JoinedCourse {
  return (row.courses as JoinedCourse) ?? {};
}

/** Load everything the learner area needs (RLS scopes it to the learner). */
export async function loadLearner(
  supabase: SupabaseClient,
): Promise<LearnerData> {
  const [
    { data: enrRaw },
    { data: certRaw },
    { data: attemptsRaw },
    { data: me },
  ] = await Promise.all([
    supabase
      .from("enrolments")
      .select(
        "id, course_id, status, progress, due_date, assigned_at, attempt_count, completion_count, courses(title, topics(title))",
      )
      .order("assigned_at", { ascending: false }),
    supabase
      .from("certificates")
      .select(
        "id, course_id, certificate_number, issued_at, expires_at, courses(title, topics(title))",
      )
      .order("issued_at", { ascending: false }),
    supabase
      .from("quiz_attempts")
      .select("submitted_at")
      .not("submitted_at", "is", null)
      .order("submitted_at", { ascending: false })
      .limit(300),
    supabase
      .from("users")
      .select("full_name, email, notifications_read_at")
      .single(),
  ]);

  const enrolments: Enrolment[] = (enrRaw ?? []).map((e) => {
    const c = pickCourse(e);
    return {
      id: e.id,
      course_id: e.course_id,
      status: e.status,
      progress: e.progress,
      due_date: e.due_date,
      assigned_at: e.assigned_at,
      attempt_count: e.attempt_count ?? 0,
      completion_count: e.completion_count ?? 0,
      title: c.title ?? "Course",
      topic: c.topics?.title ?? null,
    };
  });

  const certificates: Certificate[] = (certRaw ?? []).map((c) => {
    const co = pickCourse(c);
    return {
      id: c.id,
      course_id: c.course_id,
      number: c.certificate_number,
      issued_at: c.issued_at,
      expires_at: c.expires_at,
      title: co.title ?? "Course",
      topic: co.topics?.title ?? null,
    };
  });

  const activityDates = [
    ...(attemptsRaw ?? []).map((a) => new Date(a.submitted_at)),
    ...certificates.map((c) => new Date(c.issued_at)),
  ];

  return {
    enrolments,
    certificates,
    activityDates,
    readAt: me?.notifications_read_at ?? null,
    fullName: me?.full_name ?? null,
    email: me?.email ?? null,
  };
}

/**
 * The learner's star-bank total: assessment stars (best per course, capped at
 * 20, derived from quiz_attempts) plus in-content stars (one row per earned
 * question in content_question_stars). RLS scopes both reads to the learner.
 * Resilient — any error yields 0 rather than breaking the shell.
 */
export async function loadStarTotal(supabase: SupabaseClient): Promise<number> {
  try {
    const [{ data: attempts }, { data: certs }, { count }] = await Promise.all([
      supabase
        .from("quiz_attempts")
        .select("course_id, score, question_ids, submitted_at")
        .not("submitted_at", "is", null),
      // Certificate expiries bound the compliance cycles; a renewal after expiry
      // earns a fresh pool of assessment stars.
      supabase.from("certificates").select("course_id, expires_at"),
      supabase
        .from("content_question_stars")
        .select("id", { count: "exact", head: true }),
    ]);
    const assessmentStars = computeStarTotal(attempts ?? [], certs ?? []);
    return assessmentStars + (count ?? 0);
  } catch {
    return 0;
  }
}

/** Minimal shapes the notifications badge needs (see lib/notifications.ts). */
export interface BadgeData {
  enrolments: { course_id: string; status: string; assigned_at: string; title: string }[];
  certificates: {
    id: string;
    course_id: string;
    issued_at: string;
    expires_at: string | null;
    title: string;
  }[];
  readAt: string | null;
}

/**
 * Lightweight load for the sidebar unread-notifications badge. Runs on EVERY
 * learner page (via DashboardShell), so it deliberately skips the 300-row
 * quiz_attempts read, ordering and extra columns that full loadLearner pulls.
 */
export async function loadBadgeData(
  supabase: SupabaseClient,
): Promise<BadgeData> {
  const [{ data: enrRaw }, { data: certRaw }, { data: me }] = await Promise.all([
    supabase.from("enrolments").select("course_id, status, assigned_at, courses(title)"),
    supabase.from("certificates").select("id, course_id, issued_at, expires_at, courses(title)"),
    supabase.from("users").select("notifications_read_at").single(),
  ]);
  return {
    enrolments: (enrRaw ?? []).map((e) => ({
      course_id: e.course_id,
      status: e.status,
      assigned_at: e.assigned_at,
      title: pickCourse(e).title ?? "Course",
    })),
    certificates: (certRaw ?? []).map((c) => ({
      id: c.id,
      course_id: c.course_id,
      issued_at: c.issued_at,
      expires_at: c.expires_at,
      title: pickCourse(c).title ?? "Course",
    })),
    readAt: me?.notifications_read_at ?? null,
  };
}

export interface LearnerStats {
  assigned: number;
  notStarted: number;
  inProgress: number;
  completed: number;
  expired: number;
  certificates: number;
  overdue: number;
  expiring: number;
  completionPct: number;
  overallPct: number;
}

export function learnerStats(
  enrolments: Enrolment[],
  certificates: Certificate[],
  now: Date,
): LearnerStats {
  const assigned = enrolments.length;
  const completed = enrolments.filter((e) => e.status === "completed").length;
  const overdue = enrolments.filter((e) =>
    isOverdue(e.due_date, e.status, now),
  ).length;

  // Expiring = latest cert per course flagged amber/red but not yet expired.
  const latest = new Map<string, Certificate>();
  for (const c of certificates) if (!latest.has(c.course_id)) latest.set(c.course_id, c);
  const expiring = [...latest.values()].filter((c) => {
    const f = expiryFlag(c.expires_at ? new Date(c.expires_at) : null, now);
    return f === "amber" || f === "red";
  }).length;

  // Overall progress counts partly-finished courses, not just completed ones,
  // so a learner mid-way through several courses isn't shown a demoralising
  // low number. A completed course counts as 100%; others use their content
  // progress. completionPct (completed / assigned) is kept for anything that
  // needs the strict "fully done" ratio.
  const overallPct =
    assigned > 0
      ? Math.round(
          enrolments.reduce(
            (sum, e) => sum + (e.status === "completed" ? 100 : e.progress),
            0,
          ) / assigned,
        )
      : 0;

  return {
    assigned,
    notStarted: enrolments.filter((e) => e.status === "not_started").length,
    inProgress: enrolments.filter((e) => e.status === "in_progress").length,
    completed,
    expired: enrolments.filter((e) => e.status === "expired").length,
    certificates: certificates.length,
    overdue,
    expiring,
    completionPct: assigned > 0 ? Math.round((completed / assigned) * 100) : 0,
    overallPct,
  };
}
