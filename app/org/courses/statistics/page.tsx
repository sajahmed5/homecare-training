import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { loadCourseEnrolmentRows } from "@/lib/course-stats";
import { CourseEnrolmentsTable } from "./course-enrolments-table";

/**
 * Courses → Statistics: the raw data behind the Overview rollup — one row per
 * enrolment (learner × course) with the course's expected duration next to
 * what the learner actually took (design doc v3).
 */
export default async function CourseStatisticsPage() {
  await requireRole("org_admin");
  const supabase = await createClient();
  const [rows, { data: organisation }] = await Promise.all([
    loadCourseEnrolmentRows(supabase),
    supabase.from("organisations").select("name").single(),
  ]);

  return (
    <CourseEnrolmentsTable
      rows={rows}
      filename={`${organisation?.name ?? "org"}-course-enrolments.csv`}
    />
  );
}
