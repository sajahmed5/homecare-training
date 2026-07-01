import Link from "next/link";
import { notFound } from "next/navigation";
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
import { EditOrgForm } from "./edit-org-form";

const ROLE_LABELS: Record<string, string> = {
  org_admin: "Admin",
  learner: "Learner",
};

export default async function OrganisationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const context = await requireRole("platform_admin");
  const { id } = await params;

  const supabase = await createClient();
  const [{ data: org }, { data: staff }] = await Promise.all([
    supabase
      .from("organisations")
      .select(
        "id, name, package_tier, status, forms_enabled, recruitment_enabled",
      )
      .eq("id", id)
      .single(),
    supabase
      .from("users")
      .select("id, full_name, email, role, created_at")
      .eq("organisation_id", id)
      .order("created_at", { ascending: true }),
  ]);

  if (!org) notFound();

  return (
    <DashboardShell title={org.name} context={context}>
      <div className="mx-auto max-w-3xl space-y-6">
        <Link
          href="/platform"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Back to organisations
        </Link>

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

        <Card>
          <CardHeader>
            <CardTitle>Staff</CardTitle>
            <CardDescription>{staff?.length ?? 0} member(s).</CardDescription>
          </CardHeader>
          <CardContent>
            {staff && staff.length > 0 ? (
              <ul className="divide-y text-sm">
                {staff.map((u) => (
                  <li
                    key={u.id}
                    className="flex items-center justify-between py-2"
                  >
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
            ) : (
              <p className="text-sm text-muted-foreground">
                No staff yet — the org admin invite may still be pending.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
