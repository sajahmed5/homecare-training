import Link from "next/link";
import {
  AlertTriangle,
  BadgeAlert,
  BookOpenCheck,
  CalendarClock,
  CheckCircle2,
  Clock,
  MoonStar,
  UserRoundX,
  Users,
} from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { tierLabel } from "@/lib/organisations";
import { StatTile } from "@/components/learner-ui";
import { DashboardShell } from "@/components/dashboard-shell";
import { bucketOf, isActiveLearner, isInactive30d, isNeverActive, loadOrgLearners } from "@/lib/org-learners";
import { NudgeAllButton } from "./nudge-all-button";
import { NudgeNeverSignedInButton } from "./nudge-never-signed-in-button";

export default async function OrgDashboard() {
  const context = await requireRole("org_admin");

  // All reads go through RLS — an org_admin only ever sees their own org + staff.
  const supabase = await createClient();
  const [{ data: organisation }, allLearners] = await Promise.all([
    supabase
      .from("organisations")
      .select("name, package_tier, forms_enabled, recruitment_enabled, observations_enabled")
      .single(),
    loadOrgLearners(supabase),
  ]);

  // Headline numbers count active staff only; deactivated stay in the matrix.
  const learners = allLearners.filter(isActiveLearner);
  const nowMs = new Date().getTime();

  const inactive = learners.filter((r) => isInactive30d(r, nowMs)).length;
  const neverActive = learners.filter(isNeverActive).length;
  const inProgress = learners.filter((r) => bucketOf(r) === "in_progress").length;
  const withOverdue = learners.filter((r) => r.stats.overdue > 0).length;

  const totals = learners.reduce(
    (t, r) => ({
      assigned: t.assigned + r.stats.assigned,
      completed: t.completed + r.stats.completed,
      overdue: t.overdue + r.stats.overdue,
      late: t.late + r.lateCompletions,
      expiring: t.expiring + r.stats.expiring,
    }),
    { assigned: 0, completed: 0, overdue: 0, late: 0, expiring: 0 },
  );
  const overallPct =
    totals.assigned > 0
      ? Math.round((totals.completed / totals.assigned) * 100)
      : 0;

  // Reminders for the manager. Each entry can carry a `show` flag so
  // package-gated sources (e.g. the future document matrix) simply slot in.
  const reminders = [
    withOverdue > 0 && {
      key: "overdue",
      tone: "alert" as const,
      text: `${withOverdue} staff member${withOverdue === 1 ? " has" : "s have"} overdue training — send them a reminder.`,
      href: "/org/learners?filter=overdue#learners",
      action: <NudgeAllButton />,
    },
    neverActive > 0 && {
      key: "never",
      tone: "alert" as const,
      text: `${neverActive} staff member${neverActive === 1 ? " has" : "s have"} never signed in — they can't start their training until they do.`,
      href: "/org/learners?filter=never#learners",
      action: <NudgeNeverSignedInButton count={neverActive} />,
    },
    totals.expiring > 0 && {
      key: "expiring",
      tone: "warn" as const,
      text: `${totals.expiring} certificate${totals.expiring === 1 ? " is" : "s are"} expiring soon or already expired.`,
      href: "/org/coverage",
      action: null,
    },
  ].filter(Boolean) as {
    key: string;
    tone: "alert" | "warn";
    text: string;
    href: string;
    action: React.ReactNode;
  }[];

  return (
    <DashboardShell
      title={organisation?.name ?? "Organisation console"}
      context={context}
    >
      <div className="mx-auto max-w-5xl space-y-6">
        <p className="text-sm text-muted-foreground">
          {organisation?.name} ·{" "}
          {tierLabel(organisation?.package_tier ?? "core")}
        </p>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Learners
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="Active learners" value={learners.length} icon={Users} color="#0284c7" href="/org/learners" />
            <StatTile label="Inactive 30d+" value={inactive} icon={MoonStar} color="#8b5cf6" href="/org/learners?filter=inactive#learners" />
            <StatTile label="Never signed in" value={neverActive} icon={UserRoundX} color="#e11d48" href="/org/learners?filter=never#learners" />
            <StatTile label="In progress" value={inProgress} icon={Clock} color="#f59e0b" href="/org/learners?filter=in_progress#learners" />
            <StatTile label="With overdue" value={withOverdue} icon={AlertTriangle} color="#e11d48" href="/org/learners?filter=overdue#learners" />
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Courses
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="Assigned training complete" value={`${overallPct}%`} icon={CheckCircle2} color="#10b981" hint={`${totals.completed} of ${totals.assigned} courses`} href="/org/courses" />
            <StatTile label="Overdue" value={totals.overdue} icon={BadgeAlert} color="#ef4444" href="/org/learners/statistics?status=overdue" />
            <StatTile label="Completed" value={totals.completed} icon={BookOpenCheck} color="#16a34a" href="/org/learners/statistics?status=completed" />
            <StatTile label="Completed late" value={totals.late} icon={CalendarClock} color="#f97316" href="/org/learners/statistics?status=late" />
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Notifications &amp; reminders
          </h2>
          <div className="rounded-2xl border bg-card">
            {reminders.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted-foreground">
                Nothing needs your attention — everyone&apos;s on track ✓
              </p>
            ) : (
              <ul className="divide-y">
                {reminders.map((r) => (
                  <li
                    key={r.key}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                  >
                    <span className="flex min-w-0 items-center gap-2 text-sm">
                      <span
                        aria-hidden
                        className={`size-2 shrink-0 rounded-full ${
                          r.tone === "alert" ? "bg-rose-500" : "bg-amber-500"
                        }`}
                      />
                      <Link href={r.href} className="min-w-0 hover:underline">
                        {r.text}
                      </Link>
                    </span>
                    {r.action}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
