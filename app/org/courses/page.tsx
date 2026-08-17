import {
  BadgeAlert,
  BookOpenCheck,
  CalendarClock,
  CheckCircle2,
} from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { StatTile } from "@/components/learner-ui";
import { isActiveLearner, loadOrgLearners } from "@/lib/org-learners";
import { loadCourseStats } from "@/lib/course-stats";
import { CourseStatsTable } from "./course-stats-table";

/**
 * Courses overview: the course headline numbers (active staff only) over the
 * per-course rollup table — every tile links down to it (design doc v3), so a
 * headline number and the courses behind it are one page apart.
 */
export default async function CoursesOverviewPage() {
  await requireRole("org_admin");
  const supabase = await createClient();
  const [learnerRows, rows, { data: organisation }] = await Promise.all([
    loadOrgLearners(supabase),
    loadCourseStats(supabase),
    supabase.from("organisations").select("name").single(),
  ]);
  const learners = learnerRows.filter(isActiveLearner);

  const totals = learners.reduce(
    (t, r) => ({
      assigned: t.assigned + r.stats.assigned,
      completed: t.completed + r.stats.completed,
      overdue: t.overdue + r.stats.overdue,
      late: t.late + r.lateCompletions,
    }),
    { assigned: 0, completed: 0, overdue: 0, late: 0 },
  );
  const overallPct =
    totals.assigned > 0
      ? Math.round((totals.completed / totals.assigned) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile
          label="Overall completion"
          value={`${overallPct}%`}
          icon={CheckCircle2}
          color="#10b981"
          href="#courses"
        />
        <StatTile
          label="Overdue"
          value={totals.overdue}
          icon={BadgeAlert}
          color="#ef4444"
          href="#courses"
        />
        <StatTile
          label="Completed"
          value={totals.completed}
          icon={BookOpenCheck}
          color="#16a34a"
          href="#courses"
        />
        <StatTile
          label="Completed late"
          value={totals.late}
          icon={CalendarClock}
          color="#f97316"
          href="#courses"
        />
      </div>

      <section id="courses" className="scroll-mt-6 space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Courses
        </h2>
        <CourseStatsTable
          rows={rows}
          filename={`${organisation?.name ?? "org"}-course-statistics.csv`}
        />
      </section>
    </div>
  );
}
