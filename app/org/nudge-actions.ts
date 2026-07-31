"use server";

import { headers } from "next/headers";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import type { SupabaseClient } from "@supabase/supabase-js";

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

type Outcome = "sent" | "skipped" | "nothing";

/**
 * Email one learner about their outstanding training. Shared by the single and
 * bulk nudge actions. Skips (returns "skipped") if the learner was reminded in
 * the last 24h; returns "nothing" if they have nothing outstanding.
 */
async function nudgeOne(
  admin: SupabaseClient,
  organisationId: string,
  origin: string,
  learner: { id: string; full_name: string | null; email: string },
): Promise<Outcome> {
  const { data: enrolments } = await admin
    .from("enrolments")
    .select("last_reminder_at, courses(title)")
    .eq("user_id", learner.id)
    .eq("organisation_id", organisationId)
    .neq("status", "completed");

  const outstanding = enrolments ?? [];
  if (outstanding.length === 0) return "nothing";

  const dayAgo = Date.now() - 24 * 60 * 60_000;
  const recentlyReminded = outstanding.every(
    (e) => e.last_reminder_at && new Date(e.last_reminder_at).getTime() > dayAgo,
  );
  if (recentlyReminded) return "skipped";

  const titles = outstanding.map(
    (e) => (e.courses as unknown as { title?: string } | null)?.title ?? "a course",
  );
  const list = titles.map((t) => `<li>${t}</li>`).join("");
  const subject = "A reminder to complete your training";
  const html = `<p>Hi ${learner.full_name ?? "there"},</p>
<p>You have training still to complete on My Care Academy:</p>
<ul>${list}</ul>
<p>Please <a href="${origin}/learn">log in and finish your outstanding courses</a> when you can.</p>
<p>Thank you.</p>`;

  const sent = await sendEmail({ to: learner.email, subject, html });
  await admin.from("email_log").insert({
    organisation_id: organisationId,
    to_email: learner.email,
    type: "org_nudge",
    subject,
    sent,
  });
  await admin
    .from("enrolments")
    .update({ last_reminder_at: new Date().toISOString() })
    .eq("user_id", learner.id)
    .eq("organisation_id", organisationId)
    .neq("status", "completed");

  return "sent";
}

/** Remind one learner about their outstanding training (org admin only). */
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

  const origin = await siteOrigin();
  const outcome = await nudgeOne(admin, context.organisationId, origin, {
    id: learner.id,
    full_name: learner.full_name,
    email: learner.email,
  });

  if (outcome === "nothing")
    return { ok: true, skipped: true, message: "Nothing outstanding to remind about." };
  if (outcome === "skipped")
    return { ok: true, skipped: true, message: "Already reminded in the last 24 hours." };
  return { ok: true, message: "Reminder sent." };
}

export interface BulkNudgeResult {
  ok: boolean;
  error?: string;
  reminded: number;
  skipped: number;
}

/**
 * Remind every learner in the org who has overdue training (a past due date on a
 * course they haven't completed). Respects the same 24h per-learner guard.
 */
export async function nudgeAllOverdueAction(): Promise<BulkNudgeResult> {
  const context = await requireRole("org_admin");
  if (!context.organisationId) return { ok: false, error: "No organisation.", reminded: 0, skipped: 0 };

  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  // due_date <= today (a date = midnight) matches lib/engine-logic isOverdue,
  // which treats a course due today as overdue — same as the overdue counts.
  const { data: overdue } = await admin
    .from("enrolments")
    .select("user_id")
    .eq("organisation_id", context.organisationId)
    .neq("status", "completed")
    .not("due_date", "is", null)
    .lte("due_date", today);
  const userIds = [...new Set((overdue ?? []).map((e) => e.user_id as string))];
  if (userIds.length === 0) return { ok: true, reminded: 0, skipped: 0 };

  const { data: learners } = await admin
    .from("users")
    .select("id, full_name, email")
    .eq("organisation_id", context.organisationId)
    .eq("role", "learner")
    .in("id", userIds);

  const origin = await siteOrigin();
  let reminded = 0;
  let skipped = 0;
  for (const l of learners ?? []) {
    if (!l.email) continue;
    const outcome = await nudgeOne(admin, context.organisationId, origin, {
      id: l.id,
      full_name: l.full_name,
      email: l.email,
    });
    if (outcome === "sent") reminded += 1;
    else skipped += 1;
  }
  return { ok: true, reminded, skipped };
}
