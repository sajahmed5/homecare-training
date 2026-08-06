import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolvePortalOrg, isOrg } from "@/lib/portal-api";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

/**
 * Allocate training from the portal.
 *
 * Body: { externalRefs: string[], courseIds?: string[], pathwayIds?: string[], dueDate?: "yyyy-mm-dd" }
 *
 * Pathways expand to their courses, exactly like the platform's own assign
 * action, and the write is the same idempotent upsert on (user_id, course_id):
 * assigning something a carer already has NEVER resets their progress — it
 * only fills in a due date they were missing. Learners are resolved by
 * external_ref; unknown refs are reported back, not silently dropped.
 */
export async function POST(req: Request) {
  const org = await resolvePortalOrg(req);
  if (!isOrg(org)) return org;

  let body: { externalRefs?: string[]; courseIds?: string[]; pathwayIds?: string[]; dueDate?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }
  const refs = (body.externalRefs ?? []).filter(Boolean);
  if (refs.length === 0 || refs.length > 1000) return NextResponse.json({ error: "Send 1-1000 externalRefs" }, { status: 400 });
  const dueDate = body.dueDate && /^\d{4}-\d{2}-\d{2}$/.test(body.dueDate) ? body.dueDate : null;

  const admin = createAdminClient();

  // Expand pathways -> courses, dedupe.
  const courseIds = new Set((body.courseIds ?? []).filter(Boolean));
  const pathwayIds = (body.pathwayIds ?? []).filter(Boolean);
  if (pathwayIds.length) {
    const { data } = await admin.from("pathway_courses").select("course_id").in("pathway_id", pathwayIds);
    for (const pc of data ?? []) courseIds.add(pc.course_id);
  }
  if (courseIds.size === 0) return NextResponse.json({ error: "Nothing to assign" }, { status: 400 });

  // Only real courses — a stale id from the portal must not insert a ghost.
  const { data: courses } = await admin.from("courses").select("id").in("id", [...courseIds]);
  const validCourseIds = (courses ?? []).map((c) => c.id);

  const { data: users } = await admin
    .from("users")
    .select("id, external_ref, status")
    .eq("organisation_id", org.id)
    .in("external_ref", refs);
  const foundRefs = new Set((users ?? []).map((u) => u.external_ref));
  const unknownRefs = refs.filter((r) => !foundRefs.has(r));
  const activeUsers = (users ?? []).filter((u) => u.status === "active");

  const rows = activeUsers.flatMap((u) =>
    validCourseIds.map((courseId) => ({
      organisation_id: org.id,
      user_id: u.id,
      course_id: courseId,
      due_date: dueDate,
      assigned_at: new Date().toISOString(),
    })),
  );

  let assigned = 0;
  if (rows.length) {
    const { error, count } = await admin
      .from("enrolments")
      .upsert(rows, { onConflict: "user_id,course_id", ignoreDuplicates: false, count: "exact" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    assigned = count ?? rows.length;
  }

  await logAudit({
    organisationId: org.id,
    action: "portal.assign_training",
    entity: "enrolments",
    detail: { learners: activeUsers.length, courses: validCourseIds.length, dueDate, unknownRefs },
  });

  return NextResponse.json({
    assigned,
    learners: activeUsers.length,
    courses: validCourseIds.length,
    unknownRefs,
    inactiveRefs: (users ?? []).filter((u) => u.status !== "active").map((u) => u.external_ref),
  });
}
