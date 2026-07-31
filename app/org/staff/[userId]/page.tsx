import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card, CardContent } from "@/components/ui/card";
import {
  ProgressRing,
  StatTile,
  StatusPill,
  TopicBadge,
  type StatusVariant,
} from "@/components/learner-ui";
import { learnerStats } from "@/lib/learner-data";
import { isOverdue, expiryFlag } from "@/lib/engine-logic";
import {
  loadOrgLearnerTraining,
  formatDuration,
  type OrgEnrolment,
} from "@/lib/org-learner";

function fmtDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function statusVariant(e: OrgEnrolment, now: Date): StatusVariant {
  if (isOverdue(e.due_date, e.status, now)) return "overdue";
  if (e.status === "completed") return "completed";
  if (e.status === "expired") return "retake";
  if (e.status === "in_progress") return "in_progress";
  return "assigned";
}

export default async function StaffDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const context = await requireRole("org_admin");
  const { userId } = await params;

  const supabase = await createClient();
  const { profile, enrolments, certificates, assessments } =
    await loadOrgLearnerTraining(supabase, userId);
  if (!profile) notFound();

  const now = new Date();
  const stats = learnerStats(enrolments, certificates, now);
  const name = profile.full_name ?? profile.email ?? "Learner";

  // Newest certificate per course (list is already issued_at desc).
  const certByCourse = new Map<string, (typeof certificates)[number]>();
  for (const c of certificates) if (!certByCourse.has(c.course_id)) certByCourse.set(c.course_id, c);

  return (
    <DashboardShell title={name} context={context}>
      <div className="mx-auto max-w-4xl space-y-6">
        <Link
          href="/org"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← All staff
        </Link>

        {/* Learner header */}
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-6 pt-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold">{name}</h2>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs capitalize text-muted-foreground">
                  {profile.role === "org_admin" ? "Admin" : "Learner"}
                </span>
                {profile.status === "deactivated" && (
                  <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs text-rose-700">
                    Deactivated
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
            </div>
            <ProgressRing value={stats.overallPct} size={104} stroke={10}>
              <span className="text-2xl font-semibold">{stats.overallPct}%</span>
              <span className="text-xs text-muted-foreground">overall</span>
            </ProgressRing>
          </CardContent>
        </Card>

        {/* At-a-glance tiles */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatTile label="Assigned" value={stats.assigned} icon={BookOpen} color="#6366f1" />
          <StatTile label="In progress" value={stats.inProgress} icon={Clock} color="#f59e0b" />
          <StatTile label="Completed" value={stats.completed} icon={CheckCircle2} color="#10b981" />
          <StatTile label="Overdue" value={stats.overdue} icon={AlertTriangle} color="#ef4444" />
        </div>

        {/* Per-course breakdown */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground">
            Courses ({enrolments.length})
          </h3>
          {enrolments.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                No training assigned to this person yet.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {enrolments.map((e) => {
                const a = assessments.get(e.course_id);
                const cert = certByCourse.get(e.course_id);
                const pct = e.status === "completed" ? 100 : e.progress;
                const certFlag = cert
                  ? expiryFlag(cert.expires_at ? new Date(cert.expires_at) : null, now)
                  : "none";
                return (
                  <Card key={e.id}>
                    <CardContent className="space-y-3 pt-6">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="space-y-1">
                          <p className="font-medium">{e.title}</p>
                          <TopicBadge topic={e.topic} />
                        </div>
                        <StatusPill variant={statusVariant(e, now)} />
                      </div>

                      {/* Progress bar */}
                      <div className="space-y-1">
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-teal-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span>{pct}% content</span>
                          <span>Time spent: {formatDuration(e.time_spent)}</span>
                          <span>Assigned {fmtDate(e.assigned_at)}</span>
                          {e.due_date && <span>Due {fmtDate(e.due_date)}</span>}
                        </div>
                      </div>

                      {/* Assessment history */}
                      {a && a.attempts > 0 ? (
                        <div className="rounded-lg border bg-muted/30 p-3">
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                            <span className="font-medium">Assessment</span>
                            <span className="text-muted-foreground">
                              {a.attempts} attempt{a.attempts === 1 ? "" : "s"}
                            </span>
                            <span className="text-muted-foreground">
                              Best {a.best ?? 0}%
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                a.passed
                                  ? "bg-green-100 text-green-700"
                                  : "bg-rose-100 text-rose-700"
                              }`}
                            >
                              {a.passed ? "Passed" : "Not yet passed"}
                            </span>
                          </div>
                          <ul className="mt-2 space-y-1">
                            {a.history.map((h, i) => (
                              <li
                                key={i}
                                className="flex items-center justify-between text-xs text-muted-foreground"
                              >
                                <span>{fmtDate(h.submitted_at)}</span>
                                <span className="flex items-center gap-2">
                                  <span className="font-medium text-foreground">
                                    {h.score}%
                                  </span>
                                  <span
                                    className={
                                      h.passed ? "text-green-600" : "text-rose-600"
                                    }
                                  >
                                    {h.passed ? "Pass" : "Fail"}
                                  </span>
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          No assessment attempts yet.
                        </p>
                      )}

                      {/* Certificate */}
                      {cert && (
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                          <span className="font-medium">Certificate</span>
                          <span className="font-mono text-muted-foreground">
                            {cert.number}
                          </span>
                          <span className="text-muted-foreground">
                            · issued {fmtDate(cert.issued_at)}
                          </span>
                          <span
                            className={
                              certFlag === "red"
                                ? "text-rose-600"
                                : certFlag === "amber"
                                  ? "text-amber-600"
                                  : "text-muted-foreground"
                            }
                          >
                            ·{" "}
                            {cert.expires_at
                              ? `expires ${fmtDate(cert.expires_at)}`
                              : "no expiry"}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
