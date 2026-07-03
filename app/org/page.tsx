import Link from "next/link";
import { AlertTriangle, BookOpen, CheckCircle2, Users } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { tierLabel } from "@/lib/organisations";
import { buttonVariants } from "@/components/ui/button";
import { StatTile } from "@/components/learner-ui";
import { DashboardShell } from "@/components/dashboard-shell";
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
    { data: enrolments },
  ] = await Promise.all([
    supabase
      .from("organisations")
      .select("name, package_tier, forms_enabled, recruitment_enabled")
      .single(),
    supabase
      .from("users")
      .select("id, full_name, email, role, status, created_at")
      .order("created_at", { ascending: true }),
    supabase.from("courses").select("id, title").order("sort_order"),
    supabase.from("pathways").select("id, title").order("title"),
    supabase.from("enrolments").select("user_id, status, progress, due_date"),
  ]);

  const activeStaff = (staff ?? []).filter((u) => (u.status ?? "active") === "active");
  const today = new Date().toISOString().slice(0, 10);

  // Per-staff compliance rollup (RAG).
  const compliance = new Map<
    string,
    { assigned: number; completed: number; overdue: number }
  >();
  for (const e of enrolments ?? []) {
    const c = compliance.get(e.user_id) ?? {
      assigned: 0,
      completed: 0,
      overdue: 0,
    };
    c.assigned += 1;
    if (e.status === "completed") c.completed += 1;
    if (e.due_date && e.due_date < today && e.status !== "completed") {
      c.overdue += 1;
    }
    compliance.set(e.user_id, c);
  }

  function rag(userId: string): { label: string; className: string } {
    const c = compliance.get(userId);
    if (!c || c.assigned === 0)
      return { label: "—", className: "bg-slate-100 text-slate-500" };
    if (c.overdue > 0)
      return { label: "Overdue", className: "bg-rose-100 text-rose-700" };
    if (c.completed < c.assigned)
      return { label: "In progress", className: "bg-amber-100 text-amber-700" };
    return { label: "Compliant", className: "bg-emerald-100 text-emerald-700" };
  }

  // Org-wide compliance rollup for the summary tiles.
  const totals = [...compliance.values()].reduce(
    (t, c) => ({
      assigned: t.assigned + c.assigned,
      completed: t.completed + c.completed,
      overdue: t.overdue + c.overdue,
    }),
    { assigned: 0, completed: 0, overdue: 0 },
  );

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
            <Link
              href="/org/billing"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Billing
            </Link>
          </div>
        </div>

        {/* At-a-glance compliance across the whole team */}
        <section className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <StatTile label="Staff" value={staff?.length ?? 0} icon={Users} color="#0284c7" />
          <StatTile label="Assigned" value={totals.assigned} icon={BookOpen} color="#7c3aed" />
          <StatTile label="Completed" value={totals.completed} icon={CheckCircle2} color="#16a34a" />
          <StatTile label="Overdue" value={totals.overdue} icon={AlertTriangle} color="#e11d48" />
        </section>

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
            <CsvExport
              rows={exportRows}
              filename={`${organisation?.name ?? "staff"}-staff.csv`}
            />
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
                          <span className="font-medium">
                            {u.full_name || u.email}
                          </span>{" "}
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
                        <p className="truncate font-medium">
                          {u.full_name || u.email}
                        </p>
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
              Assign a course or a whole pathway to staff, with an optional due
              date.
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

        <Card>
          <CardHeader>
            <CardTitle>Compliance</CardTitle>
            <CardDescription>
              Training status per staff member — assigned, completed, overdue
              and their overall RAG rating.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Desktop: table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 font-medium">Name</th>
                    <th className="py-2 font-medium">Assigned</th>
                    <th className="py-2 font-medium">Completed</th>
                    <th className="py-2 font-medium">Overdue</th>
                    <th className="py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {activeStaff.map((u) => {
                    const c = compliance.get(u.id);
                    const tag = rag(u.id);
                    return (
                      <tr key={u.id} className="border-b last:border-0">
                        <td className="py-2 font-medium">
                          {u.full_name || u.email}
                        </td>
                        <td className="py-2">{c?.assigned ?? 0}</td>
                        <td className="py-2">{c?.completed ?? 0}</td>
                        <td className="py-2">{c?.overdue ?? 0}</td>
                        <td className="py-2">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${tag.className}`}
                          >
                            {tag.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile: cards */}
            <div className="space-y-2 md:hidden">
              {activeStaff.map((u) => {
                const c = compliance.get(u.id);
                const tag = rag(u.id);
                return (
                  <div key={u.id} className="rounded-xl border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="min-w-0 truncate font-medium">
                        {u.full_name || u.email}
                      </span>
                      <span
                        className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${tag.className}`}
                      >
                        {tag.label}
                      </span>
                    </div>
                    <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                      <span>Assigned {c?.assigned ?? 0}</span>
                      <span>Completed {c?.completed ?? 0}</span>
                      <span>Overdue {c?.overdue ?? 0}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
