import type { SupabaseClient } from "@supabase/supabase-js";
import { daysUntil } from "@/lib/engine-logic";

export type CertState =
  | "expired"
  | "due_30"
  | "due_60"
  | "valid"
  | "no_expiry";

export interface OrgCertificateRow {
  id: string;
  number: string;
  userId: string;
  learner: string;
  courseId: string;
  course: string;
  issuedAt: string;
  expiresAt: string | null;
  /** Negative once it has lapsed. Null when the certificate never expires. */
  daysLeft: number | null;
  state: CertState;
}

/** Expired or expiring — the rows the "needs attention" default shows. */
export const needsAttention = (r: OrgCertificateRow) =>
  r.state === "expired" || r.state === "due_30" || r.state === "due_60";

/**
 * Which renewal band a certificate sits in. Exported so the boundaries are
 * testable: expiryFlag conflates "expired" with "expiring inside 30 days" as
 * one red, which is fine for a dot but useless for a work list.
 */
export function certificateState(
  expiresAt: string | null,
  now: Date,
): { state: CertState; daysLeft: number | null } {
  if (!expiresAt) return { state: "no_expiry", daysLeft: null };
  const daysLeft = daysUntil(new Date(expiresAt), now);
  if (daysLeft < 0) return { state: "expired", daysLeft };
  if (daysLeft <= 30) return { state: "due_30", daysLeft };
  if (daysLeft <= 60) return { state: "due_60", daysLeft };
  return { state: "valid", daysLeft };
}

/**
 * Every certificate the organisation holds, newest-first by expiry urgency.
 *
 * Only the most recent certificate per learner + course is returned: a renewal
 * supersedes the one before it, and listing a superseded certificate as
 * "expired" would send someone chasing training that has already been redone.
 * This matches how learnerStats counts `expiring`, which is what the dashboard
 * warning shows.
 *
 * Deactivated learners are left out — a leaver's lapsed certificate is history,
 * not a job. RLS scopes every read to the caller's organisation.
 */
export async function loadOrgCertificates(
  supabase: SupabaseClient,
  now: Date = new Date(),
): Promise<OrgCertificateRow[]> {
  const { data } = await supabase
    .from("certificates")
    .select(
      "id, certificate_number, user_id, course_id, issued_at, expires_at, users(full_name, email, status), courses(title)",
    )
    .order("issued_at", { ascending: false });

  const latest = new Map<string, OrgCertificateRow>();
  for (const c of data ?? []) {
    const u = c.users as unknown as {
      full_name?: string;
      email?: string;
      status?: string;
    } | null;
    if (u?.status === "deactivated") continue;

    // Ordered newest-first, so the first one seen for a pair is the live one.
    const key = `${c.user_id}:${c.course_id}`;
    if (latest.has(key)) continue;

    const { state, daysLeft } = certificateState(c.expires_at as string | null, now);
    latest.set(key, {
      id: c.id as string,
      number: (c.certificate_number as string) ?? "",
      userId: c.user_id as string,
      learner: u?.full_name || u?.email || "Learner",
      courseId: c.course_id as string,
      course:
        (c.courses as unknown as { title?: string } | null)?.title ?? "Course",
      issuedAt: c.issued_at as string,
      expiresAt: c.expires_at as string | null,
      daysLeft,
      state,
    });
  }

  // Most urgent first: longest-expired at the top, never-expires at the bottom.
  return [...latest.values()].sort((a, b) => {
    if (a.daysLeft === null && b.daysLeft === null)
      return a.learner.localeCompare(b.learner);
    if (a.daysLeft === null) return 1;
    if (b.daysLeft === null) return -1;
    return a.daysLeft - b.daysLeft || a.learner.localeCompare(b.learner);
  });
}
