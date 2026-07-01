import { requireRole } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard-shell";

export default async function LearnerDashboard() {
  const context = await requireRole("learner");

  return (
    <DashboardShell title="My training" context={context}>
      <p className="max-w-prose text-muted-foreground">
        Your assigned courses, progress and certificates will appear here. The
        course player and assessments arrive in Phases 4 and 5.
      </p>
    </DashboardShell>
  );
}
