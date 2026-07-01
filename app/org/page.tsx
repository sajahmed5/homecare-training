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
import { InviteLearnerForm } from "./invite-learner-form";

const ROLE_LABELS: Record<string, string> = {
  org_admin: "Admin",
  learner: "Learner",
};

export default async function OrgDashboard() {
  const context = await requireRole("org_admin");

  // All reads go through RLS: an org_admin only ever sees their own org + staff.
  const supabase = await createClient();
  const [{ data: organisation }, { data: staff }] = await Promise.all([
    supabase.from("organisations").select("name, package_tier").single(),
    supabase
      .from("users")
      .select("id, full_name, email, role, created_at")
      .order("created_at", { ascending: true }),
  ]);

  return (
    <DashboardShell
      title={organisation?.name ?? "Organisation console"}
      context={context}
    >
      <div className="mx-auto max-w-4xl space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Invite a learner</CardTitle>
            <CardDescription>
              They&apos;ll receive an invite to join {organisation?.name ?? "your organisation"} and set a password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InviteLearnerForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Staff</CardTitle>
            <CardDescription>{staff?.length ?? 0} member(s).</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y text-sm">
              {staff?.map((u) => (
                <li key={u.id} className="flex items-center justify-between py-2">
                  <span>
                    <span className="font-medium">
                      {u.full_name || u.email}
                    </span>{" "}
                    <span className="text-muted-foreground">{u.email}</span>
                  </span>
                  <span className="text-muted-foreground">
                    {ROLE_LABELS[u.role] ?? u.role}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
