import Link from "next/link";
import { Users, CheckCircle2, AlertTriangle, MoonStar } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard-shell";
import { StatTile } from "@/components/learner-ui";
import { loadOrgLearners } from "@/lib/org-learners";
import { LearnersTable } from "./learners-table";
import { NudgeAllButton } from "../nudge-all-button";

const DAY = 86_400_000;

export default async function LearnersPage() {
  const context = await requireRole("org_admin");
  const supabase = await createClient();
  const [rows, { data: organisation }] = await Promise.all([
    loadOrgLearners(supabase),
    supabase.from("organisations").select("name").single(),
  ]);

  const total = rows.length;
  const assigned = rows.reduce((n, r) => n + r.stats.assigned, 0);
  const completed = rows.reduce((n, r) => n + r.stats.completed, 0);
  const overallPct = assigned > 0 ? Math.round((completed / assigned) * 100) : 0;
  const nowMs = new Date().getTime();
  const overdueLearners = rows.filter((r) => r.stats.overdue > 0).length;
  const inactive = rows.filter(
    (r) => !r.lastSeenAt || nowMs - new Date(r.lastSeenAt).getTime() > 30 * DAY,
  ).length;

  return (
    <DashboardShell title="Learners" context={context}>
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between gap-3">
          <Link href="/org" className="text-sm text-muted-foreground hover:underline">
            ← Overview
          </Link>
          <NudgeAllButton />
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatTile label="Learners" value={total} icon={Users} color="#0284c7" />
          <StatTile label="Overall completion" value={`${overallPct}%`} icon={CheckCircle2} color="#10b981" />
          <StatTile label="With overdue" value={overdueLearners} icon={AlertTriangle} color="#ef4444" />
          <StatTile label="Inactive 30d+" value={inactive} icon={MoonStar} color="#8b5cf6" />
        </div>

        <LearnersTable
          rows={rows}
          filename={`${organisation?.name ?? "org"}-learners.csv`}
        />
      </div>
    </DashboardShell>
  );
}
