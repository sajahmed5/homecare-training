import { redirect } from "next/navigation";
import { dashboardPathForRole, requireUser } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard-shell";

/**
 * Neutral post-login landing. Routes users to their role dashboard, or shows a
 * holding state for authenticated users who have no role/org yet (they will be
 * assigned via the invite flow in Phase 1b).
 */
export default async function DashboardPage() {
  const context = await requireUser();

  if (context.role) {
    redirect(dashboardPathForRole(context.role));
  }

  return (
    <DashboardShell title="Account pending setup" context={context}>
      <p className="max-w-prose text-muted-foreground">
        Your account isn&apos;t linked to an organisation yet. An administrator
        needs to assign your role before you can continue. (Invites arrive in
        Phase 1b.)
      </p>
    </DashboardShell>
  );
}
