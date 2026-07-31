import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard-shell";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusPill } from "@/components/learner-ui";
import { loadCourseCoverage } from "@/lib/org-learners";
import { NudgeButton } from "../nudge-button";

const selectClass =
  "flex h-9 w-full max-w-sm rounded-lg border border-input bg-background px-3 text-sm";

function fmtDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const OUTSTANDING_VARIANT: Record<string, "in_progress" | "assigned" | "not_enrolled"> = {
  in_progress: "in_progress",
  not_started: "assigned",
  expired: "assigned",
  not_enrolled: "not_enrolled",
};

export default async function CoveragePage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string }>;
}) {
  const context = await requireRole("org_admin");
  const { course: courseId } = await searchParams;

  const supabase = await createClient();
  const { data: courses } = await supabase
    .from("courses")
    .select("id, title")
    .order("title", { ascending: true });

  const coverage = courseId
    ? await loadCourseCoverage(supabase, courseId)
    : null;
  const totalLearners = coverage
    ? coverage.completed.length + coverage.outstanding.length
    : 0;
  const pct =
    coverage && totalLearners > 0
      ? Math.round((coverage.completed.length / totalLearners) * 100)
      : 0;

  return (
    <DashboardShell title="Course coverage" context={context}>
      <div className="mx-auto max-w-4xl space-y-6">
        <Link href="/org" className="text-sm text-muted-foreground hover:underline">
          ← Overview
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Who has completed a course?</CardTitle>
          </CardHeader>
          <CardContent>
            <form method="get" className="flex flex-wrap items-end gap-3">
              <select
                name="course"
                defaultValue={courseId ?? ""}
                className={selectClass}
              >
                <option value="" disabled>
                  Choose a course…
                </option>
                {(courses ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
              >
                View
              </button>
            </form>
          </CardContent>
        </Card>

        {coverage && coverage.course && (
          <>
            <Card>
              <CardContent className="space-y-2 pt-6">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{coverage.course.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {coverage.completed.length} of {totalLearners} complete ({pct}%)
                  </p>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-teal-500" style={{ width: `${pct}%` }} />
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Completed ({coverage.completed.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {coverage.completed.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nobody yet.</p>
                  ) : (
                    <ul className="space-y-2 text-sm">
                      {coverage.completed.map((l) => (
                        <li key={l.id} className="flex items-center justify-between">
                          <Link href={`/org/staff/${l.id}`} className="hover:underline">
                            {l.name}
                          </Link>
                          <span className="text-xs text-muted-foreground">
                            {fmtDate(l.completedAt)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Outstanding ({coverage.outstanding.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {coverage.outstanding.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Everyone&apos;s done ✓</p>
                  ) : (
                    <ul className="space-y-2 text-sm">
                      {coverage.outstanding.map((l) => (
                        <li key={l.id} className="flex items-center justify-between gap-2">
                          <Link href={`/org/staff/${l.id}`} className="hover:underline">
                            {l.name}
                          </Link>
                          <span className="flex items-center gap-2">
                            <StatusPill variant={OUTSTANDING_VARIANT[l.status] ?? "not_enrolled"} />
                            {l.status !== "not_enrolled" && (
                              <NudgeButton userId={l.id} size="xs" />
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
}
