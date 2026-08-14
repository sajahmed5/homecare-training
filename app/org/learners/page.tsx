import {
  Users,
  MoonStar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Timer,
  Award,
} from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { StatTile } from "@/components/learner-ui";
import { bucketOf, isActiveLearner, loadOrgLearners } from "@/lib/org-learners";
import { formatDuration } from "@/lib/org-learner";

const DAY = 86_400_000;

/** Learners overview: the headline numbers, active staff only. */
export default async function LearnersOverviewPage() {
  await requireRole("org_admin");
  const supabase = await createClient();
  const rows = (await loadOrgLearners(supabase)).filter(isActiveLearner);

  // rows is already active-only (isActiveLearner) — deactivated accounts
  // stay on the Stats & matrix page for their history.
  const nowMs = new Date().getTime();
  const assigned = rows.reduce((n, r) => n + r.stats.assigned, 0);
  const completed = rows.reduce((n, r) => n + r.stats.completed, 0);
  const overallPct = assigned > 0 ? Math.round((completed / assigned) * 100) : 0;
  const inProgress = rows.filter((r) => bucketOf(r) === "in_progress").length;
  const withOverdue = rows.filter((r) => r.stats.overdue > 0).length;
  // Inactive = has logged in before, but not in the last 30 days.
  const inactive = rows.filter(
    (r) => r.lastSeenAt && nowMs - new Date(r.lastSeenAt).getTime() > 30 * DAY,
  ).length;
  const learningSeconds = rows.reduce((n, r) => n + r.timeSpentSeconds, 0);
  const certificates = rows.reduce((n, r) => n + r.stats.certificates, 0);

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      <StatTile
        label="Active learners"
        value={rows.length}
        icon={Users}
        color="#0284c7"
        href="/org/learners/statistics"
      />
      <StatTile
        label="Inactive 30d+"
        value={inactive}
        icon={MoonStar}
        color="#8b5cf6"
        href="/org/learners/statistics?filter=inactive"
      />
      <StatTile
        label="In progress"
        value={inProgress}
        icon={Clock}
        color="#f59e0b"
        href="/org/learners/statistics?filter=in_progress"
      />
      <StatTile
        label="With overdue"
        value={withOverdue}
        icon={AlertTriangle}
        color="#ef4444"
        href="/org/learners/statistics?filter=overdue"
      />
      <StatTile
        label="Overall completion"
        value={`${overallPct}%`}
        icon={CheckCircle2}
        color="#10b981"
      />
      <StatTile
        label="Learning hours"
        value={formatDuration(learningSeconds)}
        icon={Timer}
        color="#0d9488"
      />
      <StatTile
        label="Certificates issued"
        value={certificates}
        icon={Award}
        color="#7c3aed"
      />
    </div>
  );
}
