import Link from "next/link";
import { notFound } from "next/navigation";
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
import { QuestionEditor, type Question } from "./question-editor";

export default async function CourseQuestionsPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const context = await requireRole("platform_admin");
  const { courseId } = await params;

  const supabase = await createClient();
  const [{ data: course }, { data: questions }] = await Promise.all([
    supabase.from("courses").select("id, title").eq("id", courseId).maybeSingle(),
    supabase
      .from("quiz_questions")
      .select("id, question, options, answer_index")
      .eq("course_id", courseId)
      .order("sort_order"),
  ]);

  if (!course) notFound();

  const initial: Question[] = (questions ?? []).map((q) => ({
    id: q.id as string,
    question: q.question as string,
    options: q.options as string[],
    answerIndex: q.answer_index as number,
  }));

  return (
    <DashboardShell title={`${course.title} — questions`} context={context}>
      <div className="mx-auto max-w-3xl space-y-6">
        <Link
          href="/platform/courses"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← All courses
        </Link>
        <Card>
          <CardHeader>
            <CardTitle>Assessment question bank</CardTitle>
            <CardDescription>
              Learners get a random selection from this bank. Mark the correct
              option with the radio button.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <QuestionEditor courseId={courseId} initialQuestions={initial} />
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
