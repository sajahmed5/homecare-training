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
import { buttonVariants } from "@/components/ui/button";
import { StatTile } from "@/components/learner-ui";
import { DashboardShell } from "@/components/dashboard-shell";
import { loadOrgLearners, completionsByWeek } from "@/lib/org-learners";
import { CompletionsChart } from "./completions-chart";
import { NudgeButton } from "./nudge-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InviteStaffForm } from "./invite-staff-form";
import { CsvImport } from "./csv-import";
import { CsvExport } from "./csv-export";
import { MatrixExport } from "./matrix-export";
import { StatusToggle } from "./status-toggle";
import { AssignForm } from "./assign-form";

const ROLE_LABELS: Record<string, string> = {
  org_admin: "Admin",
  learner: "Learner",
};

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
    weekly,
  ] = await Promise.all([
    supabase
      .from("organisations")
      .select("name, package_tier, forms_enabled, recruitment_enabled, observations_enabled")
      .single(),
    supabase
      .from("users")
      .select("id, full_name, email, role, status, created_at")
      .order("created_at", { ascending: true }),
    supabase.from("courses").select("id, title").order("sort_order"),
    supabase.from("pathways").select("id, title").order("title"),
    loadOrgLearners(supabase),
    completionsByWeek(supabase),
  ]);

  const activeStaff = (staff ?? []).filter((u) => (u.status ?? "active") === "active");
  const DAY = 86_400_000;
  const nowMs = new Date().getTime();

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

  // Learners who need chasing: overdue, or inactive / never active on the site.
  const needsAttention = learners
    .filter(
      (r) =>
        r.stats.overdue > 0 ||
        !r.lastSeenAt ||
        nowMs - new Date(r.lastSeenAt).getTime() > 30 * DAY,
    )
    .slice(0, 6);

  const exportRows = (staff ?? []).map((u) => ({
    full_name: u.full_name,
    email: u.email,
    role: u.role,
    status: u.status ?? "active",
  }));

  return (
    <DashboardShell
      title={organisation?.name ?? "Organisation console"}
      context={context}
    >
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {organisation?.name} ·{" "}
            {tierLabel(organisation?.package_tier ?? "core")}
          </p>
          <div className="flex gap-2">
            {organisation?.forms_enabled && (
              <Link
                href="/org/forms"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Forms
              </Link>
            )}
            {organisation?.recruitment_enabled && (
              <Link
                href="/org/recruitment"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Recruitment
              </Link>
            )}
            {organisation?.observations_enabled && (
              <Link
                href="/org/observations"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                CC assessment
              </Link>
            )}
            <Link
              href="/org/billing"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Billing
            </Link>
          </div>
        </div>

        {/* At-a-glance training rollup across the whole team */}
        <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <StatTile label="Learners" value={learners.length} icon={Users} color="#0284c7" href="/org/learners" />
          <StatTile label="Assigned" value={totals.assigned} icon={BookOpen} color="#7c3aed" />
          <StatTile label="Completed" value={totals.completed} icon={CheckCircle2} color="#16a34a" />
          <StatTile label="In progress" value={totals.inProgress} icon={Clock} color="#f59e0b" />
          <StatTile label="Not started" value={totals.notStarted} icon={CircleDashed} color="#64748b" />
          <StatTile label="Overdue" value={totals.overdue} icon={AlertTriangle} color="#e11d48" />
        </section>

        {/* Momentum + who needs chasing */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Completions trend</CardTitle>
              <CardDescription>Courses completed over recent weeks.</CardDescription>
            </CardHeader>
            <CardContent>
              <CompletionsChart data={weekly} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Needs attention</CardTitle>
                <CardDescription>Overdue or inactive learners.</CardDescription>
              </div>
              <Link
                href="/org/learners"
                className="text-sm text-primary hover:underline"
              >
                All learners →
              </Link>
            </CardHeader>
            <CardContent>
              {needsAttention.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Everyone&apos;s on track ✓
                </p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {needsAttention.map((r) => {
                    const stale =
                      !r.lastSeenAt ||
                      nowMs - new Date(r.lastSeenAt).getTime() > 30 * DAY;
                    return (
                      <li key={r.id} className="flex items-center justify-between gap-2">
                        <Link href={`/org/staff/${r.id}`} className="min-w-0 truncate hover:underline">
                          {r.name}
                        </Link>
                        <span className="flex shrink-0 items-center gap-2">
                          {r.stats.overdue > 0 && (
                            <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs text-rose-700">
                              {r.stats.overdue} overdue
                            </span>
                          )}
                          {stale && (
                            <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs text-violet-700">
                              {r.lastSeenAt ? "inactive" : "never active"}
                            </span>
                          )}
                          <NudgeButton userId={r.id} size="xs" />
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Invite a staff member</CardTitle>
              <CardDescription>
                They&apos;ll get an email to join and set a password.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InviteStaffForm />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bulk import</CardTitle>
              <CardDescription>Invite many staff from a CSV.</CardDescription>
            </CardHeader>
            <CardContent>
              <CsvImport />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Staff</CardTitle>
              <CardDescription>{staff?.length ?? 0} member(s).</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <MatrixExport
                filename={`${organisation?.name ?? "org"}-training-matrix.csv`}
              />
              <CsvExport
                rows={exportRows}
                filename={`${organisation?.name ?? "staff"}-staff.csv`}
              />
            </div>
          </CardHeader>
          <CardContent>
            {/* Desktop: table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 font-medium">Name</th>
                    <th className="py-2 font-medium">Role</th>
                    <th className="py-2 font-medium">Status</th>
                    <th className="py-2 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(staff ?? []).map((u) => {
                    const status = u.status ?? "active";
                    const isSelf = u.id === context.userId;
                    return (
                      <tr key={u.id} className="border-b last:border-0">
                        <td className="py-2">
                          <Link
                            href={`/org/staff/${u.id}`}
                            className="font-medium hover:underline"
                          >
                            {u.full_name || u.email}
                          </Link>{" "}
                          <span className="text-muted-foreground">
                            {u.email}
                          </span>
                        </td>
                        <td className="py-2">
                          {ROLE_LABELS[u.role] ?? u.role}
                        </td>
                        <td className="py-2">
                          <Badge
                            variant={
                              status === "deactivated"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {status}
                          </Badge>
                        </td>
                        <td className="py-2 text-right">
                          {isSelf ? (
                            <span className="text-xs text-muted-foreground">
                              You
                            </span>
                          ) : (
                            <StatusToggle userId={u.id} status={status} />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile: cards */}
            <div className="space-y-2 md:hidden">
              {(staff ?? []).map((u) => {
                const status = u.status ?? "active";
                const isSelf = u.id === context.userId;
                return (
                  <div key={u.id} className="rounded-xl border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link
                          href={`/org/staff/${u.id}`}
                          className="block truncate font-medium hover:underline"
                        >
                          {u.full_name || u.email}
                        </Link>
                        <p className="truncate text-xs text-muted-foreground">
                          {u.email}
                        </p>
                      </div>
                      <Badge
                        variant={
                          status === "deactivated" ? "destructive" : "secondary"
                        }
                      >
                        {status}
                      </Badge>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground">
                        {ROLE_LABELS[u.role] ?? u.role}
                      </span>
                      {isSelf ? (
                        <span className="text-xs text-muted-foreground">
                          You
                        </span>
                      ) : (
                        <StatusToggle userId={u.id} status={status} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
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
      </div>
    </DashboardShell>
  );
}
