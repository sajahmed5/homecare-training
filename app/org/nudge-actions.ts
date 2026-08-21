"use server";

import { headers } from "next/headers";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { createSetPasswordLink } from "@/lib/invites";
import { bucketOf, isActiveLearner, isNeverActive, loadOrgLearners } from "@/lib/org-learners";
import type { NudgeGroup } from "./nudge-types";
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
 * bulk nudge actions. With force=false, skips (returns "skipped") if the
 * learner was reminded in the last 24h — the bulk action uses this so "Remind
 * all" can be run twice without double-emailing. A single, deliberate Remind
 * click passes force=true and always sends (issue #9). Returns "nothing" if
 * they have nothing outstanding.
 */
async function nudgeOne(
  admin: SupabaseClient,
  organisationId: string,
  origin: string,
  learner: { id: string; full_name: string | null; email: string },
  force = false,
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
  if (recentlyReminded && !force) return "skipped";

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
  const outcome = await nudgeOne(
    admin,
    context.organisationId,
    origin,
    { id: learner.id, full_name: learner.full_name, email: learner.email },
    true,
  );

  if (outcome === "nothing")
    return { ok: true, skipped: true, message: "Nothing outstanding to remind about." };
  return { ok: true, message: "Reminder sent." };
}

export interface BulkNudgeResult {
  ok: boolean;
  error?: string;
  reminded: number;
  skipped: number;
}

/**
 * Remind a bucket of learners about outstanding training. The bucket comes
 * from bucketOf, so "overdue" and "not started" mean exactly what the pills of
 * those names on the learners list mean.
 */
async function nudgeBucket(
  admin: SupabaseClient,
  organisationId: string,
  bucket: "overdue" | "not_started",
  force: boolean,
): Promise<BulkNudgeResult> {
  // Scoped explicitly by orgId: this is the service-role client, so RLS is not
  // doing the scoping for us here.
  const rows = (await loadOrgLearners(admin, organisationId))
    .filter(isActiveLearner)
    .filter((r) => bucketOf(r) === bucket);
  if (rows.length === 0) return { ok: true, reminded: 0, skipped: 0 };

  const origin = await siteOrigin();
  let reminded = 0;
  let skipped = 0;
  for (const r of rows) {
    if (!r.email) {
      skipped += 1;
      continue;
    }
    const outcome = await nudgeOne(
      admin,
      organisationId,
      origin,
      { id: r.id, full_name: r.name, email: r.email },
      force,
    );
    if (outcome === "sent") reminded += 1;
    else skipped += 1;
  }
  return { ok: true, reminded, skipped };
}

/**
 * Remind every learner who has never signed in (users.last_seen_at is null).
 *
 * This deliberately does NOT go through nudgeOne: that path is anchored to
 * enrolments, so it bails with "nothing" for anyone with no course assigned and
 * has nowhere to record the attempt (last_reminder_at lives on the enrolment).
 * Most never-signed-in staff have nothing assigned yet, so they were
 * unreachable — the gap behind issue #22.
 *
 * These people have never set a password, so a bare /login link is no use to
 * them and their original invite token expired long ago. Each gets a fresh
 * set-password link instead.
 *
 * Repeats are allowed by design (the manager asked to be able to chase more
 * than once), so there is no 24h guard here — every run emails everyone still
 * in the group. The Reminders list on Learners → Admin shows what went and
 * when, and each send mints a new link so older ones stop mattering.
 */
async function nudgeNeverSignedIn(
  admin: SupabaseClient,
  organisationId: string,
): Promise<BulkNudgeResult> {
  const { data: learners } = await admin
    .from("users")
    .select("id, full_name, email")
    .eq("organisation_id", organisationId)
    .eq("role", "learner")
    .eq("status", "active")
    .is("last_seen_at", null);

  const { data: organisation } = await admin
    .from("organisations")
    .select("name")
    .eq("id", organisationId)
    .maybeSingle();
  const orgName = organisation?.name ?? "your organisation";

  let reminded = 0;
  let skipped = 0;
  for (const l of learners ?? []) {
    if (!l.email) {
      skipped += 1;
      continue;
    }
    // One bad address must not abandon the rest of the batch.
    let link: string;
    try {
      link = await createSetPasswordLink(l.email);
    } catch {
      skipped += 1;
      continue;
    }

    const subject = "Set up your My Care Academy account";
    const html = `<p>Hi ${l.full_name ?? "there"},</p>
<p>An account has been set up for you on My Care Academy by ${orgName}, but you
haven't signed in yet.</p>
<p>Use the link below to choose a password and get started — it only takes a
minute.</p>
<p style="margin:24px 0">
  <a href="${link}"
     style="background:#111;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none">
    Set your password
  </a>
</p>
<p>Once you're in, any training assigned to you will be waiting on your
dashboard.</p>`;

    const sent = await sendEmail({ to: l.email, subject, html });
    await admin.from("email_log").insert({
      organisation_id: organisationId,
      to_email: l.email,
      type: "org_signin_nudge",
      subject,
      sent,
    });
    if (sent) reminded += 1;
    else skipped += 1;
  }

  return { ok: true, reminded, skipped };
}

/**
 * Chase one group of learners (issue #17.3). Replaces the two single-purpose
 * bulk actions so the picker, the dashboard's quick action and the
 * notifications panel all go through one path.
 *
 * `force` decides whether someone reminded in the last 24h is emailed again.
 * The picker passes true — it is a deliberate click, on a named group, behind
 * a confirmation showing the headcount. The dashboard's one-tap button leaves
 * it false so a stray click cannot double-email everyone. The never-signed-in
 * group always sends regardless: chasing it more than once is the point, and
 * it has no per-enrolment timestamp to check anyway.
 */
export async function nudgeGroupAction(
  group: NudgeGroup,
  force = false,
): Promise<BulkNudgeResult> {
  const context = await requireRole("org_admin");
  if (!context.organisationId)
    return { ok: false, error: "No organisation.", reminded: 0, skipped: 0 };

  const admin = createAdminClient();
  return group === "never_signed_in"
    ? nudgeNeverSignedIn(admin, context.organisationId)
    : nudgeBucket(admin, context.organisationId, group, force);
}

/** Everyone in the org who has never signed in — how many the group holds. */
export async function neverSignedInCount(): Promise<number> {
  const context = await requireRole("org_admin");
  if (!context.organisationId) return 0;
  const rows = await loadOrgLearners(createAdminClient(), context.organisationId);
  return rows.filter(isActiveLearner).filter(isNeverActive).length;
}
