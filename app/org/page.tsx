import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { tierLabel } from "@/lib/organisations";
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

const ROLE_LABELS: Record<string, string> = {
  org_admin: "Admin",
  learner: "Learner",
};

export default async function OrgDashboard() {
  const context = await requireRole("org_admin");

  // All reads go through RLS — an org_admin only ever sees their own org + staff.
  const supabase = await createClient();
  const [{ data: organisation }, { data: staff }] = await Promise.all([
    supabase.from("organisations").select("name, package_tier").single(),
    supabase
      .from("users")
      .select("id, full_name, email, role, status, created_at")
      .order("created_at", { ascending: true }),
  ]);

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
        <p className="text-sm text-muted-foreground">
          {organisation?.name} · {tierLabel(organisation?.package_tier ?? "core")}
        </p>

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
            <div className="overflow-x-auto">
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Course assignment &amp; compliance</CardTitle>
            <CardDescription>
              Assigning courses and pathways with due dates, and the
              red/amber/green compliance dashboard (who&apos;s completed what,
              who&apos;s overdue, time spent), arrive once courses and
              enrolments land in Phases 4–5.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </DashboardShell>
  );
}
