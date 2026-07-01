import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { DashboardShell } from "@/components/dashboard-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface EnrolmentRow {
  id: string;
  course_id: string;
  status: string;
  progress: number;
  due_date: string | null;
  courses: { title: string } | null;
}

function CourseItem({ e }: { e: EnrolmentRow }) {
  const title = e.courses?.title ?? "Course";
  const cta =
    e.status === "completed"
      ? "Review"
      : e.progress > 0 && e.status !== "expired"
        ? "Resume"
        : e.status === "expired"
          ? "Redo"
          : "Start";

  return (
    <li className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{title}</p>
        <div className="mt-1 flex items-center gap-2">
          <div className="h-1.5 w-40 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary"
              style={{ width: `${e.progress}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">{e.progress}%</span>
          {e.due_date && (
            <span className="text-xs text-muted-foreground">
              · due {new Date(e.due_date).toLocaleDateString("en-GB")}
            </span>
          )}
        </div>
      </div>
      <Link
        href={`/learn/courses/${e.course_id}`}
        className={buttonVariants({ size: "sm" })}
      >
        {cta}
      </Link>
    </li>
  );
}

function Section({
  title,
  description,
  items,
}: {
  title: string;
  description?: string;
  items: EnrolmentRow[];
}) {
  if (items.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ul className="divide-y">
          {items.map((e) => (
            <CourseItem key={e.id} e={e} />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export default async function LearnerDashboard() {
  const context = await requireRole("learner");

  const supabase = await createClient();
  const { data } = await supabase
    .from("enrolments")
    .select("id, course_id, status, progress, due_date, courses(title)")
    .order("assigned_at", { ascending: true });

  const enrolments = (data ?? []) as unknown as EnrolmentRow[];

  const expired = enrolments.filter((e) => e.status === "expired");
  const inProgress = enrolments.filter((e) => e.status === "in_progress");
  const notStarted = enrolments.filter((e) => e.status === "not_started");
  const completed = enrolments.filter((e) => e.status === "completed");

  return (
    <DashboardShell title="My training" context={context}>
      <div className="mx-auto max-w-3xl space-y-6">
        {enrolments.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>No courses assigned yet</CardTitle>
              <CardDescription>
                When your organisation assigns you training, it will appear here.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        <Section
          title="Required again"
          description="These certificates have expired — please retake."
          items={expired}
        />
        <Section title="In progress" items={inProgress} />
        <Section title="To do" items={notStarted} />
        <Section title="Completed" items={completed} />

        <Card>
          <CardHeader>
            <CardTitle>Certificates</CardTitle>
            <CardDescription>
              Downloadable certificates appear here once you pass a course
              assessment (Phase 5).
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </DashboardShell>
  );
}
