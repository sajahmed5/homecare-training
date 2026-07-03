import Link from "next/link";
import { Building2, CheckCircle2, PauseCircle, Users } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { tierLabel } from "@/lib/organisations";
import { DashboardShell } from "@/components/dashboard-shell";
import { StatTile } from "@/components/learner-ui";
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
        <section className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <StatTile label="Organisations" value={orgs.length} icon={Building2} color="#0284c7" />
          <StatTile label="Active" value={activeCount} icon={CheckCircle2} color="#16a34a" />
          <StatTile label="Suspended" value={suspendedCount} icon={PauseCircle} color="#e11d48" />
          <StatTile label="Learners" value={learnerCount} icon={Users} color="#7c3aed" />
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
              Staff per organisation across the platform.
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
              <>
                {/* Desktop: table */}
                <div className="hidden overflow-x-auto md:block">
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

                {/* Mobile: cards */}
                <div className="space-y-2 md:hidden">
                  {orgs.map((o) => (
                    <Link
                      key={o.id}
                      href={`/platform/organisations/${o.id}`}
                      className="block rounded-xl border p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">{o.name}</span>
                        <Badge
                          variant={o.status === "suspended" ? "destructive" : "secondary"}
                        >
                          {o.status}
                        </Badge>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span>{tierLabel(o.package_tier)}</span>
                        <span>{staffByOrg.get(o.id) ?? 0} staff</span>
                        {o.forms_enabled && <Badge variant="secondary">Forms</Badge>}
                        {o.recruitment_enabled && <Badge variant="secondary">Recruitment</Badge>}
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
