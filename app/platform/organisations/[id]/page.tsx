import Link from "next/link";
import { notFound } from "next/navigation";
import { Users, CheckCircle2, AlertTriangle, MoonStar, UserRoundX } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatTile } from "@/components/learner-ui";
import { isInactive30d, isNeverActive, loadOrgLearners } from "@/lib/org-learners";
import { LearnersTable } from "@/app/org/learners/learners-table";
import { EditOrgForm } from "./edit-org-form";
import { OrgAdmins, type OrgPerson } from "./org-admins";
import { OrgNudgeButton } from "../../org-nudge-button";

export default async function OrganisationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const context = await requireRole("platform_admin");
  const { id } = await params;

  const supabase = await createClient();
  const [{ data: org }, { data: staff }, learners] = await Promise.all([
    supabase
      .from("organisations")
      .select(
        "id, name, package_tier, status, forms_enabled, recruitment_enabled, observations_enabled",
      )
      .eq("id", id)
      .single(),
    supabase
      .from("users")
      .select("id, full_name, email, role, status, created_at")
      .eq("organisation_id", id)
      .order("created_at", { ascending: true }),
    loadOrgLearners(supabase, id),
  ]);

  if (!org) notFound();

  const nowMs = new Date().getTime();
  // Deactivated accounts (leavers) stay in the table for their history, but
  // the headline numbers describe the current workforce only.
  const current = learners.filter((r) => r.status !== "deactivated");
  const assigned = current.reduce((n, r) => n + r.stats.assigned, 0);
  const completed = current.reduce((n, r) => n + r.stats.completed, 0);
  const completionPct = assigned > 0 ? Math.round((completed / assigned) * 100) : 0;
  const overdueLearners = current.filter((r) => r.stats.overdue > 0).length;
  // Was "no last_seen_at OR stale", which silently folded never-signed-in
  // staff into "Inactive 30d+" — the same org then read 223 here and 0 on the
  // org's own page under an identical label. Both sides now share one
  // definition and never-signed-in gets its own tile (issue #22).
  const inactive = current.filter((r) => isInactive30d(r, nowMs)).length;
  const neverActive = current.filter(isNeverActive).length;

  const person = (u: NonNullable<typeof staff>[number]): OrgPerson => ({
    id: u.id,
    name: u.full_name || u.email || "Unnamed",
    email: u.email,
    role: u.role,
  });
  const admins = (staff ?? []).filter((u) => u.role === "org_admin").map(person);
  // Only active learners can be usefully promoted — a leaver can't log in.
  const promotable = (staff ?? [])
    .filter((u) => u.role === "learner" && u.status !== "deactivated")
    .map(person);

  return (
    <DashboardShell title={org.name} context={context}>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/platform/organisations"
            className="text-sm text-muted-foreground hover:underline"
          >
            ← Organisations
          </Link>
          <OrgNudgeButton orgId={org.id} />
        </div>

        {/* Engagement at a glance */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatTile label="Learners" value={current.length} icon={Users} color="#0284c7" />
          <StatTile label="Assigned training complete" value={`${completionPct}%`} icon={CheckCircle2} color="#10b981" hint={`${completed} of ${assigned} courses`} />
          <StatTile label="With overdue" value={overdueLearners} icon={AlertTriangle} color="#ef4444" />
          <StatTile label="Inactive 30d+" value={inactive} icon={MoonStar} color="#8b5cf6" />
          <StatTile label="Never signed in" value={neverActive} icon={UserRoundX} color="#e11d48" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Admins</CardTitle>
            <CardDescription>
              Who can manage this organisation. Role changes apply when that
              person&apos;s session next refreshes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OrgAdmins orgId={org.id} admins={admins} promotable={promotable} />
          </CardContent>
        </Card>

        {learners.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Learners</CardTitle>
              <CardDescription>
                {learners.length} in this organisation. Filter by status or
                activity, including deactivated accounts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Capped: a few hundred rows otherwise buries everything below
                  it, which is what made this page unusable (issues #19/#20). */}
              <div className="max-h-[32rem] overflow-y-auto">
                <LearnersTable rows={learners} readOnly />
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Organisation settings</CardTitle>
            <CardDescription>
              Manage the tier, feature add-ons and status.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EditOrgForm org={org} />
          </CardContent>
        </Card>

      </div>
    </DashboardShell>
  );
}
