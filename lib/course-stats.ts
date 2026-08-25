import type { SupabaseClient } from "@supabase/supabase-js";

export interface CourseStatsRow {
  id: string;
  title: string;
  assigned: number;
  attempts: number;
  inProgress: number;
  completions: number;
  /** The course's expected duration in seconds (courses.estimated_minutes),
   *  null when the course has no estimate set. */
  expectedSeconds: number | null;
  /** Completion-time stats in seconds, from tracked in-course time. Null when
   *  no completed enrolment has any tracked time. */
  quickestSeconds: number | null;
  longestSeconds: number | null;
  averageSeconds: number | null;
}

/** One enrolment — the raw rows the per-course rollup above is built from. */
export interface CourseEnrolmentRow {
  courseId: string;
  course: string;
  userId: string;
  learner: string;
  status: string;
  /** Content completion 0-100 — with status, tells "read it all, hasn't sat
   *  the assessment" apart from a plain half-finished course (issue #25). */
  progress: number;
  attempts: number;
  expectedSeconds: number | null;
  /** Tracked in-course time. Null when nothing has been tracked yet. */
  actualSeconds: number | null;
}

const minutesToSeconds = (m: number | null | undefined) =>
  typeof m === "number" && m > 0 ? m * 60 : null;

/**
 * Per-course rollup for the Courses → Overview table: how many staff are
 * assigned, quiz attempts, in-progress and completion counts, the course's
 * expected duration and the shortest/longest/average time to complete
 * (tracked in-course time of completed enrolments). RLS scopes every read to
 * the caller's organisation.
 */
export async function loadCourseStats(
  supabase: SupabaseClient,
): Promise<CourseStatsRow[]> {
  const [{ data: courses }, { data: enrolments }, { data: attempts }] =
    await Promise.all([
      supabase
        .from("courses")
        .select("id, title, estimated_minutes")
        .order("title"),
      supabase.from("enrolments").select("course_id, status, time_spent"),
      supabase
        .from("quiz_attempts")
        .select("course_id")
        .not("submitted_at", "is", null),
    ]);

  const attemptCount = new Map<string, number>();
  for (const a of attempts ?? []) {
    attemptCount.set(a.course_id, (attemptCount.get(a.course_id) ?? 0) + 1);
  }

  const byCourse = new Map<
    string,
    { assigned: number; inProgress: number; completions: number; times: number[] }
  >();
  for (const e of enrolments ?? []) {
    const agg =
      byCourse.get(e.course_id) ??
      { assigned: 0, inProgress: 0, completions: 0, times: [] };
    agg.assigned += 1;
    if (e.status === "in_progress") agg.inProgress += 1;
    if (e.status === "completed") {
      agg.completions += 1;
      if (e.time_spent && e.time_spent > 0) agg.times.push(e.time_spent);
    }
    byCourse.set(e.course_id, agg);
  }

  return (courses ?? [])
    .map((c) => {
      const agg =
        byCourse.get(c.id) ??
        { assigned: 0, inProgress: 0, completions: 0, times: [] };
      const times = agg.times;
      return {
        id: c.id,
        title: c.title as string,
        assigned: agg.assigned,
        attempts: attemptCount.get(c.id) ?? 0,
        inProgress: agg.inProgress,
        completions: agg.completions,
        expectedSeconds: minutesToSeconds(c.estimated_minutes),
        quickestSeconds: times.length ? Math.min(...times) : null,
        longestSeconds: times.length ? Math.max(...times) : null,
        averageSeconds: times.length
          ? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
          : null,
      };
    })
    // Only courses the org actually uses; a fully unused catalogue row is noise.
    .filter((c) => c.assigned > 0 || c.attempts > 0);
}

/**
 * Courses → Statistics: one row per enrolment (learner × course) — the raw
 * data behind every number in the Overview table. Assigned/in progress/
 * completions are the row counts per status; shortest/longest/average are the
 * min/max/mean of the actual-time column over completed rows.
 */
export async function loadCourseEnrolmentRows(
  supabase: SupabaseClient,
): Promise<CourseEnrolmentRow[]> {
  const [{ data: enrolments }, { data: attempts }] = await Promise.all([
    supabase
      .from("enrolments")
      .select(
        "user_id, course_id, status, progress, time_spent, courses(title, estimated_minutes), users(full_name, email)",
      ),
    supabase
      .from("quiz_attempts")
      .select("user_id, course_id")
      .not("submitted_at", "is", null),
  ]);

  const attemptCount = new Map<string, number>();
  for (const a of attempts ?? []) {
    const key = `${a.user_id}:${a.course_id}`;
    attemptCount.set(key, (attemptCount.get(key) ?? 0) + 1);
  }

  return (enrolments ?? [])
    .map((e) => {
      const c = e.courses as unknown as {
        title?: string;
        estimated_minutes?: number | null;
      } | null;
      const u = e.users as unknown as {
        full_name?: string;
        email?: string;
      } | null;
      return {
        courseId: e.course_id as string,
        course: c?.title ?? "Course",
        userId: e.user_id as string,
        learner: u?.full_name || u?.email || "Learner",
        status: e.status as string,
        progress: (e.progress as number) ?? 0,
        attempts: attemptCount.get(`${e.user_id}:${e.course_id}`) ?? 0,
        expectedSeconds: minutesToSeconds(c?.estimated_minutes),
        actualSeconds: e.time_spent && e.time_spent > 0 ? e.time_spent : null,
      };
    })
    .sort(
      (a, b) =>
        a.course.localeCompare(b.course) || a.learner.localeCompare(b.learner),
    );
}
