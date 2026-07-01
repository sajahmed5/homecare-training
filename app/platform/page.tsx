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
import { InviteOrgForm } from "./invite-org-form";

export default async function PlatformDashboard() {
  const context = await requireRole("platform_admin");

  const supabase = await createClient();
  const { data: organisations } = await supabase
    .from("organisations")
    .select("id, name, package_tier, status, created_at")
    .order("created_at", { ascending: false });

  return (
    <DashboardShell title="Platform console" context={context}>
      <div className="mx-auto max-w-4xl space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Invite an organisation</CardTitle>
            <CardDescription>
              Creates the organisation and emails its first administrator an
              invite to set up their account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InviteOrgForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Organisations</CardTitle>
            <CardDescription>
              {organisations?.length ?? 0} organisation(s).
            </CardDescription>
          </CardHeader>
          <CardContent>
            {organisations && organisations.length > 0 ? (
              <ul className="divide-y text-sm">
                {organisations.map((o) => (
                  <li
                    key={o.id}
                    className="flex items-center justify-between py-2"
                  >
                    <span className="font-medium">{o.name}</span>
                    <span className="text-muted-foreground">
                      {o.package_tier} · {o.status}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                No organisations yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
