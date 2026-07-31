"use server";

import { headers } from "next/headers";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";

export interface OrgNudgeResult {
  ok: boolean;
  reminded?: number;
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
 * Nudge an organisation's admins to get their team training. Platform-admin
 * only. Emails every active org_admin of the org and logs it. Skips if the org
 * was already nudged in the last 24h (email_log dedup).
 */
export async function nudgeOrgAdminsAction(orgId: string): Promise<OrgNudgeResult> {
  await requireRole("platform_admin");
  const admin = createAdminClient();

  const { data: org } = await admin
    .from("organisations")
    .select("id, name")
    .eq("id", orgId)
    .maybeSingle();
  if (!org) return { ok: false, error: "Organisation not found." };

  // 24h dedup guard.
  const dayAgo = new Date(Date.now() - 24 * 60 * 60_000).toISOString();
  const { count: recent } = await admin
    .from("email_log")
    .select("id", { count: "exact", head: true })
    .eq("organisation_id", orgId)
    .eq("type", "platform_nudge")
    .gte("created_at", dayAgo);
  if ((recent ?? 0) > 0) {
    return { ok: true, skipped: true, message: "Already nudged in the last 24 hours." };
  }

  const { data: admins } = await admin
    .from("users")
    .select("email, full_name")
    .eq("organisation_id", orgId)
    .eq("role", "org_admin")
    .eq("status", "active");

  const recipients = (admins ?? []).filter((a) => a.email);
  if (recipients.length === 0) {
    return { ok: false, error: "This organisation has no active admins to contact." };
  }

  const origin = await siteOrigin();
  const subject = "Your team's training on My Care Academy";
  let reminded = 0;
  for (const a of recipients) {
    const html = `<p>Hi ${a.full_name ?? "there"},</p>
<p>We noticed some of your staff still have training to complete on My Care Academy.</p>
<p>Please <a href="${origin}/org">log in to your organisation console</a> to review who's outstanding, assign courses, and send reminders.</p>
<p>If we can help you get set up, just reply to this email.</p>`;
    const sent = await sendEmail({ to: a.email!, subject, html });
    await admin.from("email_log").insert({
      organisation_id: orgId,
      to_email: a.email,
      type: "platform_nudge",
      subject,
      sent,
    });
    if (sent) reminded += 1;
  }

  return {
    ok: true,
    reminded,
    message: reminded
      ? `Nudged ${recipients.length} admin${recipients.length === 1 ? "" : "s"}.`
      : "Logged — email delivery isn't configured yet.",
  };
}
