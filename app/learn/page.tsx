import Link from "next/link";
import {
  BookOpen,
  Clock,
  CheckCircle2,
  Award,
  AlertTriangle,
  Star,
  ShieldCheck,
  GraduationCap,
  Flame,
  type LucideIcon,
} from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { loadLearner, learnerStats } from "@/lib/learner-data";
import { computeBadges, computeStreak } from "@/lib/gamification";
import { topicTheme, tint } from "@/lib/topic-theme";
import { DashboardShell } from "@/components/dashboard-shell";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  StatTile,
  ProgressRing,
  DueSoonBanner,
  BadgeChip,
} from "@/components/learner-ui";
import { CourseCard } from "./modules/course-card";

const nowMs = () => Date.now();

const BADGE_ICON: Record<string, LucideIcon> = {
  first_pass: Award,
  five_done: Star,
  compliant: ShieldCheck,
  induction: GraduationCap,
};

export default async function LearnerDashboard() {
  const context = await requireRole("learner");
  const now = new Date(nowMs());
  const supabase = await createClient();

  const data = await loadLearner(supabase);
  const stats = learnerStats(data.enrolments, data.certificates, now);

  // Induction pathway progress.
  const { data: pathway } = await supabase
    .from("pathways")
    .select("id")
    .eq("slug", "care-certificate-induction")
    .maybeSingle();
  let inductionTotal = 0;
  let inductionCompleted = 0;
  if (pathway) {
    const { data: links } = await supabase
      .from("pathway_courses")
      .select("course_id")
      .eq("pathway_id", pathway.id);
    const set = new Set((links ?? []).map((l) => l.course_id));
    inductionTotal = set.size;
    inductionCompleted = data.enrolments.filter(
      (e) => set.has(e.course_id) && e.status === "completed",
    ).length;
  }

  const badges = computeBadges({
    assigned: stats.assigned,
    completed: stats.completed,
    certificates: stats.certificates,
    overdue: stats.overdue,
    inductionTotal,
    inductionCompleted,
  });
  const streak = computeStreak(data.activityDates, now);

  // Progress grouped by topic.
  const byTopic = new Map<string, { completed: number; total: number }>();
  for (const e of data.enrolments) {
    const k = e.topic ?? "General";
    const t = byTopic.get(k) ?? { completed: 0, total: 0 };
    t.total += 1;
    if (e.status === "completed") t.completed += 1;
    byTopic.set(k, t);
  }

  const recent = data.certificates.slice(0, 4);
  const firstName = (data.fullName ?? "").split(" ")[0] || "there";
  const myWork = data.enrolments
    .filter((e) => e.status !== "completed")
    .slice(0, 4);

  return (
    <DashboardShell title="Dashboard" context={context}>
      {/* Warm the shared H5P runtime at low priority so the first course the
          learner opens loads from cache (cached long-term via next.config). */}
      <link rel="prefetch" href="/h5p/assets/frame.bundle.js" as="script" />
      <link rel="prefetch" href="/h5p/assets/main.bundle.js" as="script" />
      <link rel="prefetch" href="/h5p/assets/styles/h5p.css" as="style" />
      <div className="mx-auto max-w-5xl space-y-6">
        <DueSoonBanner count={stats.overdue + stats.expiring} />

        {/* Hero */}
        <div className="flex flex-col items-center gap-6 rounded-3xl border bg-gradient-to-br from-primary/10 via-card to-card p-6 sm:flex-row sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Hi {firstName} 👋
            </h2>
            <p className="mt-1 text-muted-foreground">
              {stats.completed} of {stats.assigned} assigned course
              {stats.assigned === 1 ? "" : "s"} completed.
              {streak > 0 && (
                <span className="ml-1 inline-flex items-center gap-1 font-medium text-orange-600">
                  <Flame className="size-4" /> {streak}-day streak
                </span>
              )}
            </p>
          </div>
          <ProgressRing value={stats.completionPct} color="#0d9488">
            <span className="text-2xl font-bold">{stats.completionPct}%</span>
            <span className="text-xs text-muted-foreground">complete</span>
          </ProgressRing>
        </div>

        {/* My work: Assigned */}
        {myWork.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight">
                My work: Assigned
              </h2>
              <Link
                href="/learn/modules"
                className="text-sm font-medium text-primary hover:underline"
              >
                See all
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {myWork.map((e) => (
                <CourseCard
                  key={e.id}
                  c={{
                    courseId: e.course_id,
                    title: e.title,
                    topic: e.topic,
                    status: e.status,
                    progress: e.progress,
                    dueDate: e.due_date,
                  }}
                />
              ))}
            </div>
          </section>
        )}

        {/* Stat tiles */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
          <StatTile label="Assigned" value={stats.assigned} icon={BookOpen} color="#0284c7" href="/learn/modules" />
          <StatTile label="In progress" value={stats.inProgress} icon={Clock} color="#d97706" href="/learn/modules" />
          <StatTile label="Completed" value={stats.completed} icon={CheckCircle2} color="#16a34a" href="/learn/modules/completed" />
          <StatTile label="Certificates" value={stats.certificates} icon={Award} color="#7c3aed" href="/learn/certificates" />
          <StatTile label="Need attention" value={stats.overdue + stats.expiring} icon={AlertTriangle} color="#e11d48" href="/learn/notifications" />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Progress by topic */}
          <Card>
            <CardHeader>
              <CardTitle>Progress by topic</CardTitle>
              <CardDescription>How you&apos;re doing in each area.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {byTopic.size === 0 && (
                <p className="text-sm text-muted-foreground">
                  No courses assigned yet.
                </p>
              )}
              {[...byTopic.entries()].map(([topic, t]) => {
                const theme = topicTheme(topic);
                const pct = t.total ? Math.round((t.completed / t.total) * 100) : 0;
                return (
                  <div key={topic}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium">{topic}</span>
                      <span className="text-muted-foreground">
                        {t.completed}/{t.total}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: theme.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Induction + recent */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Care Certificate induction</CardTitle>
                <CardDescription>
                  {inductionCompleted}/{inductionTotal} courses complete
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{
                      width: `${inductionTotal ? Math.round((inductionCompleted / inductionTotal) * 100) : 0}%`,
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent achievements</CardTitle>
              </CardHeader>
              <CardContent>
                {recent.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Pass a course to see it here 🎓
                  </p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {recent.map((c) => (
                      <li key={c.id} className="flex items-center gap-2">
                        <span
                          className="flex size-6 items-center justify-center rounded-full"
                          style={{ backgroundColor: tint("#16a34a"), color: "#16a34a" }}
                        >
                          <Award className="size-3.5" />
                        </span>
                        <span className="truncate">{c.title}</span>
                        <span className="ml-auto text-xs text-muted-foreground">
                          {new Date(c.issued_at).toLocaleDateString("en-GB")}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Badges */}
        <Card>
          <CardHeader>
            <CardTitle>Your badges</CardTitle>
            <CardDescription>Milestones you&apos;ve unlocked.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {badges.map((b) => (
                <BadgeChip
                  key={b.key}
                  label={b.label}
                  description={b.description}
                  icon={BADGE_ICON[b.key] ?? Award}
                  earned={b.earned}
                  color="#7c3aed"
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <Link href="/learn/modules" className={buttonVariants({ size: "lg" })}>
            Go to my training
          </Link>
        </div>
      </div>
    </DashboardShell>
  );
}
