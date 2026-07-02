import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { parseBlocks, allH5P } from "@/lib/content";
import { DashboardShell } from "@/components/dashboard-shell";
import { H5PCoursePlayer } from "@/components/content/h5p-course-player";
import { CoursePlayer } from "./course-player";

export default async function CoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const context = await requireRole("learner");
  const { courseId } = await params;

  const supabase = await createClient();

  // RLS scopes this to the learner's own enrolment; no enrolment => not assigned.
  const { data: enrolment } = await supabase
    .from("enrolments")
    .select("id, current_block")
    .eq("course_id", courseId)
    .maybeSingle();
  if (!enrolment) notFound();

  const { data: course } = await supabase
    .from("courses")
    .select("title, content_blocks")
    .eq("id", courseId)
    .maybeSingle();
  if (!course) notFound();

  const blocks = parseBlocks(course.content_blocks);
  const h5pPages = allH5P(blocks);

  return (
    <DashboardShell title={course.title} context={context}>
      {h5pPages ? (
        <H5PCoursePlayer
          enrolmentId={enrolment.id}
          courseId={courseId}
          title={course.title}
          pages={h5pPages}
          initialBlock={enrolment.current_block ?? 0}
        />
      ) : (
        <CoursePlayer
          enrolmentId={enrolment.id}
          courseId={courseId}
          title={course.title}
          blocks={blocks}
          initialBlock={enrolment.current_block ?? 0}
        />
      )}
    </DashboardShell>
  );
}
