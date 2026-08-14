import { FileBarChart } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard-shell";

/** Reports — intentionally empty for now; content arrives later (design doc v2). */
export default async function OrgReportsPage() {
  const context = await requireRole("org_admin");
  return (
    <DashboardShell title="Reports" context={context}>
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed bg-card px-6 py-16 text-center">
          <FileBarChart className="size-8 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Reports are coming soon</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            This is where your organisation&apos;s reports will live. Nothing
            here yet — check back after the next update.
          </p>
        </div>
      </div>
    </DashboardShell>
  );
}
