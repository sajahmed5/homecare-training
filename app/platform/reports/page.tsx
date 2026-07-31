import Link from "next/link";
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
import { STATUS_LABELS, statusPillClass } from "./status";

interface ReportRow {
  id: string;
  report_no: number;
  summary: string;
  reporter_email: string | null;
  reporter_role: string | null;
  page_path: string | null;
  status: string;
  created_at: string;
}

function fmt(d: string): string {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function ReportsAdminPage() {
  const context = await requireRole("platform_admin");

  const supabase = await createClient();
  const { data } = await supabase
    .from("issue_reports")
    .select(
      "id, report_no, summary, reporter_email, reporter_role, page_path, status, created_at",
    )
    .order("created_at", { ascending: false });
  const reports = (data ?? []) as ReportRow[];
  const openCount = reports.filter((r) => r.status === "open").length;

  return (
    <DashboardShell title="Issues & bug reports" context={context}>
      <div className="mx-auto max-w-4xl space-y-6">
        <Link
          href="/platform"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Back to console
        </Link>
        <Card>
          <CardHeader>
            <CardTitle>Reported issues</CardTitle>
            <CardDescription>
              Feedback and bug reports from across the platform.{" "}
              {openCount > 0
                ? `${openCount} open.`
                : "Nothing open right now."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reports.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No reports yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-2 font-medium">#</th>
                      <th className="py-2 font-medium">Issue</th>
                      <th className="py-2 font-medium">Reporter</th>
                      <th className="py-2 font-medium">Status</th>
                      <th className="py-2 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((r) => (
                      <tr
                        key={r.id}
                        className="border-b last:border-0 hover:bg-accent/40"
                      >
                        <td className="py-2 pr-2 font-mono text-muted-foreground">
                          <Link
                            href={`/platform/reports/${r.id}`}
                            className="block"
                          >
                            {r.report_no}
                          </Link>
                        </td>
                        <td className="py-2 pr-2">
                          <Link
                            href={`/platform/reports/${r.id}`}
                            className="block font-medium hover:underline"
                          >
                            {r.summary}
                          </Link>
                          {r.page_path && (
                            <span className="block truncate text-xs text-muted-foreground">
                              {r.page_path}
                            </span>
                          )}
                        </td>
                        <td className="py-2 pr-2 text-muted-foreground">
                          {r.reporter_email ?? "—"}
                        </td>
                        <td className="py-2 pr-2">
                          <span className={statusPillClass(r.status)}>
                            {STATUS_LABELS[r.status] ?? r.status}
                          </span>
                        </td>
                        <td className="py-2 whitespace-nowrap text-muted-foreground">
                          {fmt(r.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
