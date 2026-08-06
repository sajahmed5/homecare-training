import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolvePortalOrg, isOrg } from "@/lib/portal-api";

export const dynamic = "force-dynamic";

/**
 * Every portal-managed learner's training state, keyed by the portal's own
 * carer id. This is the read the portal's training matrix, carer profiles and
 * oversight numbers are built from — the platform is the single source of
 * truth and this is its window.
 *
 * Certificate PDFs live in a private bucket; each certificate carries a
 * short-lived signed URL (1 hour), minted fresh on every call, so the portal
 * never needs storage credentials.
 */
export async function GET(req: Request) {
  const org = await resolvePortalOrg(req);
  if (!isOrg(org)) return org;

  const admin = createAdminClient();
  const { data: users } = await admin
    .from("users")
    .select("id, external_ref, full_name, email, status, last_seen_at")
    .eq("organisation_id", org.id)
    .not("external_ref", "is", null);
  const userIds = (users ?? []).map((u) => u.id);
  if (userIds.length === 0) return NextResponse.json({ learners: [], courses: [] });

  const [enrolQ, certQ, coursesQ] = await Promise.all([
    admin
      .from("enrolments")
      .select("user_id, course_id, status, progress, due_date, completion_count, assigned_at")
      .eq("organisation_id", org.id)
      .in("user_id", userIds),
    admin
      .from("certificates")
      .select("user_id, course_id, certificate_number, issued_at, expires_at, pdf_path")
      .eq("organisation_id", org.id)
      .in("user_id", userIds)
      .order("issued_at", { ascending: false }),
    admin.from("courses").select("id, title, expiry_months"),
  ]);

  // One signed URL per certificate, an hour of validity.
  const signed = new Map<string, string>();
  for (const c of certQ.data ?? []) {
    if (!c.pdf_path) continue;
    const { data } = await admin.storage.from("certificates").createSignedUrl(c.pdf_path, 3600);
    if (data?.signedUrl) signed.set(c.certificate_number, data.signedUrl);
  }

  const enrolByUser = new Map<string, typeof enrolQ.data>();
  for (const e of enrolQ.data ?? []) {
    const list = enrolByUser.get(e.user_id) ?? [];
    list.push(e);
    enrolByUser.set(e.user_id, list);
  }
  const certsByUser = new Map<string, typeof certQ.data>();
  for (const c of certQ.data ?? []) {
    const list = certsByUser.get(c.user_id) ?? [];
    list.push(c);
    certsByUser.set(c.user_id, list);
  }

  return NextResponse.json({
    courses: (coursesQ.data ?? []).map((c) => ({ id: c.id, title: c.title, expiryMonths: c.expiry_months })),
    learners: (users ?? []).map((u) => ({
      externalRef: u.external_ref,
      fullName: u.full_name,
      email: u.email,
      status: u.status,
      lastSeenAt: u.last_seen_at,
      enrolments: (enrolByUser.get(u.id) ?? []).map((e) => ({
        courseId: e.course_id,
        status: e.status,
        progress: e.progress,
        dueDate: e.due_date,
        completionCount: e.completion_count,
        assignedAt: e.assigned_at,
      })),
      certificates: (certsByUser.get(u.id) ?? []).map((c) => ({
        certificateNumber: c.certificate_number,
        courseId: c.course_id,
        issuedAt: c.issued_at,
        expiresAt: c.expires_at,
        downloadUrl: signed.get(c.certificate_number) ?? null,
      })),
    })),
  });
}
