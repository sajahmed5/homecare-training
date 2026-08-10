import Link from "next/link";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Clock,
  CircleDashed,
  Users,
} from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { tierLabel } from "@/lib/organisations";
import { StatTile } from "@/components/learner-ui";
import { DashboardShell } from "@/components/dashboard-shell";
import { bucketOf, loadOrgLearners } from "@/lib/org-learners";
import { NudgeButton } from "./nudge-button";
import { NudgeAllButton } from "./nudge-all-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AssignForm } from "./assign-form";

export default async function OrgDashboard() {
  const context = await requireRole("org_admin");

  // All reads go through RLS — an org_admin only ever sees their own org + staff.
  const supabase = await createClient();
  const [
    { data: organisation },
    { data: staff },
    { data: courses },
    { data: pathways },
    learners,
  ] = await Promise.all([
    supabase
      .from("organisations")
      .select("name, package_tier, forms_enabled, recruitment_enabled, observations_enabled")
      .single(),
    supabase
      .from("users")
      .select("id, full_name, email, role, status")
      .order("created_at", { ascending: true }),
    supabase.from("courses").select("id, title").order("sort_order"),
    supabase.from("pathways").select("id, title").order("title"),
    loadOrgLearners(supabase),
  ]);

  const activeStaff = (staff ?? []).filter((u) => (u.status ?? "active") === "active");

  // Org-wide training rollup from the per-learner stats.
  const totals = learners.reduce(
    (t, r) => ({
      assigned: t.assigned + r.stats.assigned,
      completed: t.completed + r.stats.completed,
      inProgress: t.inProgress + r.stats.inProgress,
      notStarted: t.notStarted + r.stats.notStarted,
      overdue: t.overdue + r.stats.overdue,
    }),
    { assigned: 0, completed: 0, inProgress: 0, notStarted: 0, overdue: 0 },
  );

  // Who needs chasing: overdue, or assigned training they haven't started
  // (issue #12 — activity/inactivity now lives on the Learners page).
  const needsAttention = learners.filter((r) => {
    const bucket = bucketOf(r);
    return bucket === "overdue" || bucket === "not_started";
  });

  return (
    <DashboardShell
      title={organisation?.name ?? "Organisation console"}
      context={context}
    >
      <div className="mx-auto max-w-4xl space-y-8">
        <p className="text-sm text-muted-foreground">
          {organisation?.name} ·{" "}
          {tierLabel(organisation?.package_tier ?? "core")}
        </p>

        {/* At-a-glance training rollup — every number links to its list (issue #7) */}
        <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <StatTile label="Learners" value={learners.length} icon={Users} color="#0284c7" href="/org/learners" />
          <StatTile label="Assigned" value={totals.assigned} icon={BookOpen} color="#7c3aed" href="/org/training" />
          <StatTile label="Completed" value={totals.completed} icon={CheckCircle2} color="#16a34a" href="/org/training?status=completed" />
          <StatTile label="In progress" value={totals.inProgress} icon={Clock} color="#f59e0b" href="/org/training?status=in_progress" />
          <StatTile label="Not started" value={totals.notStarted} icon={CircleDashed} color="#64748b" href="/org/training?status=not_started" />
          <StatTile label="Overdue" value={totals.overdue} icon={AlertTriangle} color="#e11d48" href="/org/training?status=overdue" />
        </section>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Needs attention</CardTitle>
              <CardDescription>
                Learners with overdue or not-started training.
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <NudgeAllButton />
              <Link
                href="/org/learners"
                className="text-sm text-primary hover:underline"
              >
                All learners →
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {needsAttention.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Everyone&apos;s on track ✓
              </p>
            ) : (
              <ul className="max-h-80 space-y-2 overflow-y-auto pr-1 text-sm">
                {needsAttention.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-2">
                    <Link href={`/org/staff/${r.id}`} className="min-w-0 truncate hover:underline">
                      {r.name}
                    </Link>
                    <span className="flex shrink-0 items-center gap-2">
                      {r.stats.overdue > 0 ? (
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs text-rose-700">
                          {r.stats.overdue} overdue
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                          not started
                        </span>
                      )}
                      <NudgeButton
                        userId={r.id}
                        size="xs"
                        lastRemindedAt={r.lastRemindedAt}
                      />
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assign training</CardTitle>
            <CardDescription>
              Assign one or more courses (or a whole pathway) to selected carers
              or everyone, with an optional due date.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AssignForm
              courses={(courses ?? []).map((c) => ({ id: c.id, title: c.title }))}
              pathways={(pathways ?? []).map((p) => ({ id: p.id, title: p.title }))}
              staff={activeStaff.map((s) => ({
                id: s.id,
                name: s.full_name || s.email,
              }))}
            />
          </CardContent>
        </Card>

        <p className="text-sm text-muted-foreground">
          Staff management — invites, bulk import and the full staff list — now
          lives on the{" "}
          <Link href="/org/learners" className="text-primary hover:underline">
            Learners page
          </Link>
          .
        </p>
      </div>
    </DashboardShell>
  );
}
