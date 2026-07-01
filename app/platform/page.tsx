import Link from "next/link";
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
import { buttonVariants } from "@/components/ui/button";
import { InviteOrgForm } from "./invite-org-form";
import { InviteAdminForm } from "./invite-admin-form";
import { StaffChart } from "./staff-chart";

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}

export default async function PlatformDashboard() {
  const context = await requireRole("platform_admin");

  const supabase = await createClient();
  const [{ data: organisations }, { data: users }] = await Promise.all([
    supabase
      .from("organisations")
      .select(
        "id, name, package_tier, status, forms_enabled, recruitment_enabled",
      )
      .order("created_at", { ascending: false }),
    supabase.from("users").select("id, organisation_id, role"),
  ]);

  const orgs = organisations ?? [];
  const allUsers = users ?? [];

  const staffByOrg = new Map<string, number>();
  for (const u of allUsers) {
    if (u.organisation_id) {
      staffByOrg.set(u.organisation_id, (staffByOrg.get(u.organisation_id) ?? 0) + 1);
    }
  }

  const activeCount = orgs.filter((o) => o.status === "active").length;
  const suspendedCount = orgs.filter((o) => o.status === "suspended").length;
  const learnerCount = allUsers.filter((u) => u.role === "learner").length;

  const chartData = orgs
    .map((o) => ({ name: o.name, staff: staffByOrg.get(o.id) ?? 0 }))
    .slice(0, 12);

  return (
    <DashboardShell title="Platform console" context={context}>
      <div className="mx-auto max-w-5xl space-y-8">
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Organisations" value={orgs.length} />
          <StatCard label="Active" value={activeCount} />
          <StatCard label="Suspended" value={suspendedCount} />
          <StatCard label="Learners" value={learnerCount} />
        </section>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Course catalogue</CardTitle>
              <CardDescription>
                Manage courses and their assessment question banks.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Link
                href="/platform/billing"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Billing
              </Link>
              <Link
                href="/platform/settings"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Automation
              </Link>
              <Link
                href="/platform/courses"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Manage courses
              </Link>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Engagement</CardTitle>
            <CardDescription>
              Staff per organisation. Course completions, overdue training and
              per-org engagement scoring appear here once courses and
              assessments land (Phases 4–5).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StaffChart data={chartData} />
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Invite an organisation</CardTitle>
              <CardDescription>
                Creates the org and invites its first administrator.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InviteOrgForm />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Add a platform admin</CardTitle>
              <CardDescription>
                Grants another member of your team global access.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InviteAdminForm />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Organisations</CardTitle>
            <CardDescription>{orgs.length} organisation(s).</CardDescription>
          </CardHeader>
          <CardContent>
            {orgs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No organisations yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-2 font-medium">Name</th>
                      <th className="py-2 font-medium">Tier</th>
                      <th className="py-2 font-medium">Add-ons</th>
                      <th className="py-2 font-medium">Staff</th>
                      <th className="py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orgs.map((o) => (
                      <tr key={o.id} className="border-b last:border-0">
                        <td className="py-2">
                          <Link
                            href={`/platform/organisations/${o.id}`}
                            className="font-medium hover:underline"
                          >
                            {o.name}
                          </Link>
                        </td>
                        <td className="py-2">{tierLabel(o.package_tier)}</td>
                        <td className="py-2">
                          <div className="flex gap-1">
                            {o.forms_enabled && (
                              <Badge variant="secondary">Forms</Badge>
                            )}
                            {o.recruitment_enabled && (
                              <Badge variant="secondary">Recruitment</Badge>
                            )}
                            {!o.forms_enabled && !o.recruitment_enabled && (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </div>
                        </td>
                        <td className="py-2">{staffByOrg.get(o.id) ?? 0}</td>
                        <td className="py-2">
                          <Badge
                            variant={
                              o.status === "suspended"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {o.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
