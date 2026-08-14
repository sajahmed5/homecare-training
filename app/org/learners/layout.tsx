import { requireRole } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard-shell";
import { LearnersNav } from "./learners-nav";

/**
 * The Learners area is three sub-pages sharing one shell and tab bar:
 * Overview (/org/learners), Stats & matrix (/matrix), Admin (/admin).
 * Child pages render content only — the shell lives here.
 */
export default async function LearnersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await requireRole("org_admin");
  return (
    <DashboardShell title="Learners" context={context}>
      <div className="mx-auto max-w-6xl space-y-6">
        <LearnersNav />
        {children}
      </div>
    </DashboardShell>
  );
}
