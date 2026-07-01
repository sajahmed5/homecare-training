import { requireRole } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard-shell";

export default async function PlatformDashboard() {
  const context = await requireRole("platform_admin");

  return (
    <DashboardShell title="Platform console" context={context}>
      <p className="max-w-prose text-muted-foreground">
        Global visibility across all organisations. Organisation management,
        feature flags and cross-org analytics arrive in Phase 2.
      </p>
    </DashboardShell>
  );
}
