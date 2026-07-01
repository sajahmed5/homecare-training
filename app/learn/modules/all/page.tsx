import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { loadLearner } from "@/lib/learner-data";
import { DashboardShell } from "@/components/dashboard-shell";
import { ModulesTabs } from "../modules-tabs";
import { AllCourses, type CatalogueCourse } from "./all-courses";

export default async function AllCoursesPage() {
  const context = await requireRole("learner");
  const supabase = await createClient();

  const [{ enrolments }, { data: courses }] = await Promise.all([
    loadLearner(supabase),
    supabase
      .from("courses")
      .select("id, title, description, topics(title)")
      .order("sort_order"),
  ]);

  const catalogue: CatalogueCourse[] = (courses ?? []).map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    topic: (c.topics as unknown as { title: string } | null)?.title ?? null,
  }));

  return (
    <DashboardShell title="Training" context={context}>
      <div className="mx-auto max-w-5xl space-y-6">
        <ModulesTabs />
        <p className="text-sm text-muted-foreground">
          Browse the full catalogue and enrol on any course.
        </p>
        <AllCourses
          courses={catalogue}
          enrolledIds={enrolments.map((e) => e.course_id)}
        />
      </div>
    </DashboardShell>
  );
}
