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

/** Courses overview: the course headline numbers, active staff only. */
export default async function CoursesOverviewPage() {
  await requireRole("org_admin");
  const supabase = await createClient();
  const learners = (await loadOrgLearners(supabase)).filter(isActiveLearner);

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
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <StatTile
        label="Overall completion"
        value={`${overallPct}%`}
        icon={CheckCircle2}
        color="#10b981"
        href="/org/courses/statistics"
      />
      <StatTile
        label="Overdue"
        value={totals.overdue}
        icon={BadgeAlert}
        color="#ef4444"
        href="/org/learners/statistics?status=overdue"
      />
      <StatTile
        label="Completed"
        value={totals.completed}
        icon={BookOpenCheck}
        color="#16a34a"
        href="/org/learners/statistics?status=completed"
      />
      <StatTile
        label="Completed late"
        value={totals.late}
        icon={CalendarClock}
        color="#f97316"
        href="/org/learners/statistics?status=late"
      />
    </div>
  );
}
