import type { SupabaseClient } from "@supabase/supabase-js";

export interface CourseStatsRow {
  id: string;
  title: string;
  assigned: number;
  attempts: number;
  inProgress: number;
  completions: number;
  /** Completion-time stats in seconds, from tracked in-course time. Null when
   *  no completed enrolment has any tracked time. */
  quickestSeconds: number | null;
  longestSeconds: number | null;
  averageSeconds: number | null;
}

/**
 * Per-course rollup for the Courses → Statistics page: how many staff are
 * assigned, quiz attempts, in-progress and completion counts, and
 * quickest/longest/average time to complete (tracked in-course time of
 * completed enrolments). RLS scopes every read to the caller's organisation.
 */
export async function loadCourseStats(
  supabase: SupabaseClient,
): Promise<CourseStatsRow[]> {
  const [{ data: courses }, { data: enrolments }, { data: attempts }] =
    await Promise.all([
      supabase.from("courses").select("id, title").order("title"),
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
