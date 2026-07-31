"use server";

import { headers } from "next/headers";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";

export interface NudgeResult {
  ok: boolean;
  skipped?: boolean;
  error?: string;
  message?: string;
}

async function siteOrigin(): Promise<string> {
  if (process.env.NEXT_PUBLIC_SITE_URL)
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

/**
 * Email a learner a reminder about their outstanding training. Org-admin only,
 * and only for a learner in the admin's own organisation (the recipient is
 * derived server-side — never trusted from the client). Skips if the learner was
 * already reminded in the last 24 hours to avoid spamming. Logs to email_log.
 */
export async function nudgeLearnerAction(userId: string): Promise<NudgeResult> {
  const context = await requireRole("org_admin");
  if (!context.organisationId) return { ok: false, error: "No organisation." };

  const admin = createAdminClient();

  const { data: learner } = await admin
    .from("users")
    .select("id, full_name, email, role, organisation_id")
    .eq("id", userId)
    .maybeSingle();
  if (
    !learner ||
    learner.role !== "learner" ||
    learner.organisation_id !== context.organisationId ||
    !learner.email
  ) {
    return { ok: false, error: "Learner not found." };
  }

  const { data: enrolments } = await admin
    .from("enrolments")
    .select("course_id, status, last_reminder_at, courses(title)")
    .eq("user_id", userId)
    .eq("organisation_id", context.organisationId)
    .neq("status", "completed");

  const outstanding = enrolments ?? [];
  if (outstanding.length === 0) {
    return { ok: true, skipped: true, message: "Nothing outstanding to remind about." };
  }

  // 24h guard: skip if every outstanding item was reminded within the last day.
  const dayAgo = Date.now() - 24 * 60 * 60_000;
  const recentlyReminded = outstanding.every(
    (e) => e.last_reminder_at && new Date(e.last_reminder_at).getTime() > dayAgo,
  );
  if (recentlyReminded) {
    return { ok: true, skipped: true, message: "Already reminded in the last 24 hours." };
  }

  const origin = await siteOrigin();
  const titles = outstanding.map(
    (e) => (e.courses as unknown as { title?: string } | null)?.title ?? "a course",
  );
  const list = titles.map((t) => `<li>${t}</li>`).join("");
  const name = learner.full_name ?? "there";
  const subject = "A reminder to complete your training";
  const html = `<p>Hi ${name},</p>
<p>You have training still to complete on My Care Academy:</p>
<ul>${list}</ul>
<p>Please <a href="${origin}/learn">log in and finish your outstanding courses</a> when you can.</p>
<p>Thank you.</p>`;

  const sent = await sendEmail({ to: learner.email, subject, html });

  await admin.from("email_log").insert({
    organisation_id: context.organisationId,
    to_email: learner.email,
    type: "org_nudge",
    subject,
    sent,
  });

  // Mark these enrolments as reminded so the 24h guard applies next time.
  const nowIso = new Date().toISOString();
  await admin
    .from("enrolments")
    .update({ last_reminder_at: nowIso })
    .eq("user_id", userId)
    .eq("organisation_id", context.organisationId)
    .neq("status", "completed");

  return {
    ok: true,
    message: sent
      ? `Reminder sent (${titles.length} course${titles.length === 1 ? "" : "s"}).`
      : "Logged — email delivery isn't configured yet.",
  };
}
