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
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const context = await requireRole("platform_admin");

  const supabase = await createClient();
  const [{ data: settings }, { data: log }] = await Promise.all([
    supabase.from("app_settings").select("key, value"),
    supabase
      .from("email_log")
      .select("type, subject, to_email, sent, created_at")
      .order("created_at", { ascending: false })
      .limit(15),
  ]);

  const map = new Map((settings ?? []).map((s) => [s.key, s.value]));
  const threshold = Number(map.get("engagement_threshold_pct") ?? 50);
  const windows = (map.get("renewal_windows_days") as number[]) ?? [60, 30, 7];
  const repeat = Number(map.get("reminder_repeat_days") ?? 7);

  return (
    <DashboardShell title="Automation settings" context={context}>
      <div className="mx-auto max-w-3xl space-y-6">
        <Link href="/platform" className="text-sm text-muted-foreground hover:underline">
          ← Back to console
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Reminders &amp; renewals</CardTitle>
            <CardDescription>
              Thresholds for the automated engine. Schedules are configured in
              vercel.json (daily + weekly).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SettingsForm
              threshold={threshold}
              windows={windows}
              repeat={repeat}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent notifications</CardTitle>
            <CardDescription>
              Last 15 automated emails across all organisations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {log && log.length > 0 ? (
              <ul className="divide-y text-sm">
                {log.map((l, i) => (
                  <li key={i} className="flex items-center justify-between py-2">
                    <span>
                      <span className="font-medium">{l.type}</span>{" "}
                      <span className="text-muted-foreground">
                        {l.to_email}
                      </span>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(l.created_at).toLocaleString("en-GB")}
                      {l.sent ? "" : " · not sent"}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                No automated emails sent yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
