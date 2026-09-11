import type { createAdminClient } from "@/lib/supabase/admin";
import { fetchAll } from "@/lib/fetch-all";

type Admin = ReturnType<typeof createAdminClient>;

/** Paths per createSignedUrls call — one request instead of one per file. */
const SIGN_BATCH = 500;

/**
 * The payload behind GET /api/portal/records: every portal-managed learner in
 * one organisation, with their enrolments and certificates.
 *
 * The response shape is the portal's contract and must not change. What
 * changed is how it's gathered — three things that each broke at a size an
 * ordinary care company reaches:
 *
 * 1. Enrolments and certificates were filtered with `.in("user_id", ids)`,
 *    which puts every learner's id in the request URL. At 260 learners that
 *    URL was already 9,845 characters; somewhere between 380 and 400 it fails
 *    outright (measured against the live API). The list was also redundant —
 *    the query is already scoped to the organisation — so the organisation
 *    filter does the work and portal-linked learners are picked out here.
 * 2. Every read is paged. Supabase silently returns at most 1,000 rows, and an
 *    organisation of ~62 carers on 16 courses each is already past that.
 * 3. Download links were created one certificate at a time: 77 ms each
 *    against a 60-second limit, so ~780 certificates timed the request out.
 *    createSignedUrls did 20 in 73 ms.
 */
export async function buildPortalRecords(admin: Admin, orgId: string) {
  const users = await fetchAll((f, t) =>
    admin
      .from("users")
      .select("id, external_ref, full_name, email, status, last_seen_at")
      .eq("organisation_id", orgId)
      .not("external_ref", "is", null)
      .order("id")
      .range(f, t),
  );
  if (users.length === 0) return { learners: [], courses: [] };
  const linked = new Set(users.map((u) => u.id as string));

  const [enrolments, certs, courses] = await Promise.all([
    fetchAll((f, t) =>
      admin
        .from("enrolments")
        .select("id, user_id, course_id, status, progress, due_date, completion_count, assigned_at")
        .eq("organisation_id", orgId)
        .order("id")
        .range(f, t),
    ),
    fetchAll((f, t) =>
      admin
        .from("certificates")
        .select("id, user_id, course_id, certificate_number, issued_at, expires_at, pdf_path")
        .eq("organisation_id", orgId)
        .order("id")
        .range(f, t),
    ),
    fetchAll((f, t) =>
      admin.from("courses").select("id, title, expiry_months").order("id").range(f, t),
    ),
  ]);

  // Only portal-managed learners — what the old id list used to select.
  const myEnrolments = enrolments.filter((e) => linked.has(e.user_id as string));
  const myCerts = certs
    .filter((c) => linked.has(c.user_id as string))
    // Newest first per learner, as before; paging orders by id instead.
    .sort((a, b) => (b.issued_at as string).localeCompare(a.issued_at as string));

  // One signed URL per certificate, an hour of validity — minted in batches.
  const signed = new Map<string, string>();
  const withPdf = myCerts.filter((c) => c.pdf_path);
  for (let i = 0; i < withPdf.length; i += SIGN_BATCH) {
    const part = withPdf.slice(i, i + SIGN_BATCH);
    const { data } = await admin.storage
      .from("certificates")
      .createSignedUrls(part.map((c) => c.pdf_path as string), 3600);
    const urlByPath = new Map((data ?? []).map((d) => [d.path, d.signedUrl]));
    for (const c of part) {
      const url = urlByPath.get(c.pdf_path as string);
      if (url) signed.set(c.certificate_number as string, url);
    }
  }

  const enrolByUser = new Map<string, typeof myEnrolments>();
  for (const e of myEnrolments) {
    const list = enrolByUser.get(e.user_id as string) ?? [];
    list.push(e);
    enrolByUser.set(e.user_id as string, list);
  }
  const certsByUser = new Map<string, typeof myCerts>();
  for (const c of myCerts) {
    const list = certsByUser.get(c.user_id as string) ?? [];
    list.push(c);
    certsByUser.set(c.user_id as string, list);
  }

  return {
    courses: courses.map((c) => ({
      id: c.id,
      title: c.title,
      expiryMonths: c.expiry_months,
    })),
    learners: users.map((u) => ({
      externalRef: u.external_ref,
      fullName: u.full_name,
      email: u.email,
      status: u.status,
      lastSeenAt: u.last_seen_at,
      enrolments: (enrolByUser.get(u.id as string) ?? []).map((e) => ({
        courseId: e.course_id,
        status: e.status,
        progress: e.progress,
        dueDate: e.due_date,
        completionCount: e.completion_count,
        assignedAt: e.assigned_at,
      })),
      certificates: (certsByUser.get(u.id as string) ?? []).map((c) => ({
        certificateNumber: c.certificate_number,
        courseId: c.course_id,
        issuedAt: c.issued_at,
        expiresAt: c.expires_at,
        downloadUrl: signed.get(c.certificate_number as string) ?? null,
      })),
    })),
  };
}
