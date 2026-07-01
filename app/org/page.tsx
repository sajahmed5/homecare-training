import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard-shell";

export default async function OrgDashboard() {
  const context = await requireRole("org_admin");

  // Reads through RLS: an org_admin only ever sees their own organisation.
  const supabase = await createClient();
  const { data: organisation } = await supabase
    .from("organisations")
    .select("name, package_tier")
    .single();

  return (
    <DashboardShell
      title={organisation?.name ?? "Organisation console"}
      context={context}
    >
      <p className="max-w-prose text-muted-foreground">
        Scoped to your organisation only. Staff management, course assignment and
        the compliance dashboard arrive in Phase 3.
      </p>
    </DashboardShell>
  );
}
