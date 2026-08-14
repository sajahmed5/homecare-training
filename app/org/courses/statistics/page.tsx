import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { loadCourseStats } from "@/lib/course-stats";
import { CourseStatsTable } from "./course-stats-table";

/**
 * Courses → Statistics: one row per course the org uses — assignments,
 * attempts, in-progress/completion counts and time-to-complete stats.
 * Course names link to the per-course coverage detail.
 */
export default async function CourseStatisticsPage() {
  await requireRole("org_admin");
  const supabase = await createClient();
  const [rows, { data: organisation }] = await Promise.all([
    loadCourseStats(supabase),
    supabase.from("organisations").select("name").single(),
  ]);

  return (
    <CourseStatsTable
      rows={rows}
      filename={`${organisation?.name ?? "org"}-course-statistics.csv`}
    />
  );
}
