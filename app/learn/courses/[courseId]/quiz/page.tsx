import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard-shell";
import { QuizRunner } from "./quiz-runner";

export default async function QuizPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const context = await requireRole("learner");
  const { courseId } = await params;

  const supabase = await createClient();
  // Must be enrolled (RLS scopes to own enrolment).
  const { data: enrolment } = await supabase
    .from("enrolments")
    .select("id")
    .eq("course_id", courseId)
    .maybeSingle();
  if (!enrolment) notFound();

  const { data: course } = await supabase
    .from("courses")
    .select("title")
    .eq("id", courseId)
    .maybeSingle();
  if (!course) notFound();

  return (
    <DashboardShell title={course.title} context={context}>
      <QuizRunner courseId={courseId} courseTitle={course.title} />
    </DashboardShell>
  );
}
