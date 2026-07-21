import type { SupabaseClient } from "@supabase/supabase-js";

/** One standard within a programme, with the learner's status for it. */
export interface ProgrammeStandard {
  standardNo: number;
  label: string;
  courseId: string;
  courseTitle: string;
  topic: string | null;
  /** Enrolment status, or "not_enrolled" when the learner has no enrolment. */
  status: string;
  progress: number;
  dueDate: string | null;
  /** True if the learner holds a (live) certificate for this standard's course. */
  certificated: boolean;
}

export interface Programme {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  complianceNote: string | null;
  standards: ProgrammeStandard[];
  completedCount: number;
  total: number;
}

/**
 * Load a programme (e.g. the Care Certificate) with each standard's course and
 * the current learner's status for it. Single owner of the pathway ->
 * pathway_courses -> courses join, used by both the dashboard card and the
 * programme landing page. All reads go through the caller's RLS-scoped client,
 * so enrolments/certificates resolve to the signed-in learner only.
 *
 * Returns null if the programme slug does not exist (e.g. before seeding).
 */
export async function loadProgramme(
  supabase: SupabaseClient,
  slug: string,
): Promise<Programme | null> {
  const { data: pathway } = await supabase
    .from("pathways")
    .select("id, slug, title, summary, compliance_note")
    .eq("slug", slug)
    .maybeSingle();
  if (!pathway) return null;

  const { data: links } = await supabase
    .from("pathway_courses")
    .select("standard_no, label, course:courses(id, title, topic:topics(title))")
    .eq("pathway_id", pathway.id)
    .order("standard_no", { ascending: true });

  // PostgREST types a to-one embed as an array; normalise to the first element.
  const one = <T>(v: T | T[] | null | undefined): T | null =>
    Array.isArray(v) ? (v[0] ?? null) : (v ?? null);

  type JoinedCourse = {
    id: string;
    title: string;
    topic?: { title?: string | null } | { title?: string | null }[] | null;
  };
  type JoinedLink = {
    standard_no: number | null;
    label: string | null;
    course: JoinedCourse | JoinedCourse[] | null;
  };
  const rows = (links ?? []) as unknown as JoinedLink[];

  const courseIds = rows
    .map((l) => one(l.course)?.id)
    .filter((id): id is string => Boolean(id));

  // The learner's enrolments and live certificates for these courses only.
  const [{ data: enrolments }, { data: certificates }] = await Promise.all([
    supabase
      .from("enrolments")
      .select("course_id, status, progress, due_date")
      .in("course_id", courseIds.length ? courseIds : ["00000000-0000-0000-0000-000000000000"]),
    supabase
      .from("certificates")
      .select("course_id")
      .in("course_id", courseIds.length ? courseIds : ["00000000-0000-0000-0000-000000000000"]),
  ]);

  const enrolByCourse = new Map(
    (enrolments ?? []).map((e) => [e.course_id, e]),
  );
  const certCourseIds = new Set((certificates ?? []).map((c) => c.course_id));

  const standards: ProgrammeStandard[] = rows
    .map((l) => {
      const course = one(l.course);
      if (!course) return null;
      const enrol = enrolByCourse.get(course.id);
      return {
        standardNo: l.standard_no ?? 0,
        label: l.label ?? course.title,
        courseId: course.id,
        courseTitle: course.title,
        topic: one(course.topic)?.title ?? null,
        status: enrol?.status ?? "not_enrolled",
        progress: enrol?.progress ?? 0,
        dueDate: enrol?.due_date ?? null,
        certificated: certCourseIds.has(course.id),
      } satisfies ProgrammeStandard;
    })
    .filter((s): s is ProgrammeStandard => s !== null);

  const completedCount = standards.filter(
    (s) => s.status === "completed",
  ).length;

  return {
    id: pathway.id,
    slug: pathway.slug,
    title: pathway.title,
    summary: pathway.summary,
    complianceNote: pathway.compliance_note,
    standards,
    completedCount,
    total: standards.length,
  };
}
