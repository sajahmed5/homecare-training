import Link from "next/link";
import { Users, CheckCircle2, AlertTriangle, MoonStar } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard-shell";
import { StatTile } from "@/components/learner-ui";
import { loadOrgLearners } from "@/lib/org-learners";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LearnersTable } from "./learners-table";
import { LearnersTabs } from "./learners-tabs";
import { RemindersTable, type ReminderRow } from "./reminders-table";
import { NudgeAllButton } from "../nudge-all-button";
import { InviteStaffForm } from "../invite-staff-form";
import { CsvImport } from "../csv-import";
import { CsvExport } from "../csv-export";
import { MatrixExport } from "../matrix-export";
import { StatusToggle } from "../status-toggle";
import { DeleteStaffButton } from "../delete-staff-button";

const DAY = 86_400_000;

const ROLE_LABELS: Record<string, string> = {
  org_admin: "Admin",
  learner: "Learner",
};

export default async function LearnersPage() {
  const context = await requireRole("org_admin");
  const supabase = await createClient();
  const [rows, { data: organisation }, { data: staff }, { data: nudgeLog }] =
    await Promise.all([
      loadOrgLearners(supabase),
      supabase.from("organisations").select("name").single(),
      supabase
        .from("users")
        .select("id, full_name, email, role, status, created_at")
        .order("created_at", { ascending: true }),
      supabase
        .from("email_log")
        .select("id, to_email, subject, sent, created_at")
        .eq("type", "org_nudge")
        .order("created_at", { ascending: false })
        .limit(200),
    ]);

  const total = rows.length;
  const assigned = rows.reduce((n, r) => n + r.stats.assigned, 0);
  const completed = rows.reduce((n, r) => n + r.stats.completed, 0);
  const overallPct = assigned > 0 ? Math.round((completed / assigned) * 100) : 0;
  const nowMs = new Date().getTime();
  const overdueLearners = rows.filter((r) => r.stats.overdue > 0).length;
  // Inactive = has logged in, but not for 30+ days. Never-active users are
  // counted separately in the table's filter pills (issue #15).
  const inactive = rows.filter(
    (r) => r.lastSeenAt && nowMs - new Date(r.lastSeenAt).getTime() > 30 * DAY,
  ).length;

  const nameByEmail = new Map<string, string>();
  for (const r of rows) if (r.email) nameByEmail.set(r.email.toLowerCase(), r.name);
  const reminders: ReminderRow[] = (nudgeLog ?? []).map((l) => ({
    id: l.id,
    toEmail: l.to_email,
    learnerName: nameByEmail.get(l.to_email.toLowerCase()) ?? null,
    subject: l.subject,
    sent: l.sent,
    createdAt: l.created_at,
  }));

  const exportRows = (staff ?? []).map((u) => ({
    full_name: u.full_name,
    email: u.email,
    role: u.role,
    status: u.status ?? "active",
  }));

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

        <LearnersTabs
          reminderCount={reminders.length}
          learners={
            <LearnersTable
              rows={rows}
              filename={`${organisation?.name ?? "org"}-learners.csv`}
            />
          }
          reminders={<RemindersTable rows={reminders} />}
        />

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Staff</CardTitle>
              <CardDescription>
                {staff?.length ?? 0} member(s) — admins and learners.
              </CardDescription>
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
            {/* Desktop: table (boxed + scrollable so it doesn't swallow the page) */}
            <div className="hidden max-h-96 overflow-y-auto rounded-xl border md:block">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card">
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="px-3 py-2 font-medium">Name</th>
                    <th className="px-3 py-2 font-medium">Role</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(staff ?? []).map((u) => {
                    const status = u.status ?? "active";
                    const isSelf = u.id === context.userId;
                    return (
                      <tr key={u.id} className="border-b last:border-0">
                        <td className="px-3 py-2">
                          <Link
                            href={`/org/staff/${u.id}`}
                            className="font-medium hover:underline"
                          >
                            {u.full_name || u.email}
                          </Link>{" "}
                          <span className="text-muted-foreground">{u.email}</span>
                        </td>
                        <td className="px-3 py-2">
                          {ROLE_LABELS[u.role] ?? u.role}
                        </td>
                        <td className="px-3 py-2">
                          <Badge
                            variant={
                              status === "deactivated" ? "destructive" : "secondary"
                            }
                          >
                            {status}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-right">
                          {isSelf ? (
                            <span className="text-xs text-muted-foreground">You</span>
                          ) : (
                            <span className="inline-flex items-center gap-2">
                              <StatusToggle userId={u.id} status={status} />
                              <DeleteStaffButton
                                userId={u.id}
                                name={u.full_name || u.email}
                              />
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile: cards */}
            <div className="max-h-96 space-y-2 overflow-y-auto md:hidden">
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
                        <span className="text-xs text-muted-foreground">You</span>
                      ) : (
                        <span className="inline-flex items-center gap-2">
                          <StatusToggle userId={u.id} status={status} />
                          <DeleteStaffButton
                            userId={u.id}
                            name={u.full_name || u.email}
                          />
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

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
      </div>
    </DashboardShell>
  );
}
