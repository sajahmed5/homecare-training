import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { loadCourseEnrolmentRows } from "@/lib/course-stats";
import { CourseEnrolmentsTable } from "./course-enrolments-table";

/**
 * Courses → Statistics: the raw data behind the Overview rollup — one row per
 * enrolment (learner × course) with the course's expected duration next to
 * what the learner actually took (design doc v3).
 *
 * `?course=` narrows it to a single course. That view replaces the old
 * standalone coverage page: clicking a course name anywhere now lands here,
 * filtered, rather than on a separate screen with its own layout (issue #23).
 */
export default async function CourseStatisticsPage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string }>;
}) {
  await requireRole("org_admin");
  const { course } = await searchParams;
  const supabase = await createClient();
  const [allRows, { data: organisation }] = await Promise.all([
    loadCourseEnrolmentRows(supabase),
    supabase.from("organisations").select("name").single(),
  ]);

  const rows = course ? allRows.filter((r) => r.courseId === course) : allRows;
  const courseName = course ? (rows[0]?.course ?? "this course") : null;
  const org = organisation?.name ?? "org";

  return (
    <div className="space-y-3">
      {courseName && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {courseName}
            </h2>
            <p className="text-sm text-muted-foreground">
              {rows.length} {rows.length === 1 ? "learner" : "learners"} assigned
              this course.
            </p>
          </div>
          <Link
            href="/org/courses/statistics"
            className="rounded-full border px-3 py-1 text-sm font-medium transition-colors hover:bg-accent"
          >
            Show all courses
          </Link>
        </div>
      )}
      <CourseEnrolmentsTable
        rows={rows}
        showCourse={!course}
        filename={
          courseName
            ? `${org}-${courseName}.csv`
            : `${org}-course-enrolments.csv`
        }
      />
    </div>
  );
}
