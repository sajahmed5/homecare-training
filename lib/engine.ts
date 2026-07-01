import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import {
  renewalStage,
  isExpired,
  isOverdue,
  engagementRate,
  daysSince,
} from "@/lib/engine-logic";

type Admin = ReturnType<typeof createAdminClient>;

export interface EngineSettings {
  engagementThreshold: number;
  renewalWindows: number[];
  reminderRepeatDays: number;
}

interface Refs {
  users: Map<string, { email: string; name: string; org: string | null; role: string; status: string }>;
  courses: Map<string, string>;
  orgs: Map<string, string>;
}

export async function loadSettings(admin: Admin): Promise<EngineSettings> {
  const { data } = await admin.from("app_settings").select("key, value");
  const map = new Map((data ?? []).map((r) => [r.key, r.value]));
  return {
    engagementThreshold: Number(map.get("engagement_threshold_pct") ?? 50),
    renewalWindows: (map.get("renewal_windows_days") as number[]) ?? [60, 30, 7],
    reminderRepeatDays: Number(map.get("reminder_repeat_days") ?? 7),
  };
}

async function loadRefs(admin: Admin): Promise<Refs> {
  const [{ data: users }, { data: courses }, { data: orgs }] =
    await Promise.all([
      admin.from("users").select("id, email, full_name, organisation_id, role, status"),
      admin.from("courses").select("id, title"),
      admin.from("organisations").select("id, name"),
    ]);
  return {
    users: new Map(
      (users ?? []).map((u) => [
        u.id,
        {
          email: u.email,
          name: u.full_name || u.email,
          org: u.organisation_id,
          role: u.role,
          status: u.status ?? "active",
        },
      ]),
    ),
    courses: new Map((courses ?? []).map((c) => [c.id, c.title])),
    orgs: new Map((orgs ?? []).map((o) => [o.id, o.name])),
  };
}

function orgAdminEmails(refs: Refs, orgId: string | null): string[] {
  if (!orgId) return [];
  return [...refs.users.values()]
    .filter((u) => u.org === orgId && u.role === "org_admin" && u.status === "active")
    .map((u) => u.email);
}

function platformAdminEmails(refs: Refs): string[] {
  return [...refs.users.values()]
    .filter((u) => u.role === "platform_admin")
    .map((u) => u.email);
}

function wrap(title: string, body: string): string {
  return `<div style="font-family:system-ui,sans-serif;max-width:520px;margin:auto">
    <h2>${title}</h2>${body}
    <p style="color:#888;font-size:12px;margin-top:24px">My Care Academy — automated notification.</p>
  </div>`;
}

async function deliver(
  admin: Admin,
  opts: {
    orgId: string | null;
    to: string;
    type: string;
    subject: string;
    html: string;
  },
  dryRun: boolean,
): Promise<void> {
  if (dryRun) return;
  const sent = await sendEmail({
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  });
  await admin.from("email_log").insert({
    organisation_id: opts.orgId,
    to_email: opts.to,
    type: opts.type,
    subject: opts.subject,
    sent,
  });
}

export interface RunSummary {
  [key: string]: number;
}

/**
 * Renewals: expire lapsed certificates (course becomes required again) and send
 * 60/30/7-day renewal reminders. Latest certificate per user+course is the live one.
 */
export async function processRenewals(
  settings: EngineSettings,
  now: Date,
  dryRun: boolean,
): Promise<RunSummary> {
  const admin = createAdminClient();
  const refs = await loadRefs(admin);

  const { data: certs } = await admin
    .from("certificates")
    .select("id, user_id, course_id, organisation_id, expires_at, reminders_sent")
    .order("issued_at", { ascending: false });

  // Keep only the most recent certificate per user+course.
  type Cert = NonNullable<typeof certs>[number];
  const latest = new Map<string, Cert>();
  for (const c of certs ?? []) {
    const key = `${c.user_id}_${c.course_id}`;
    if (!latest.has(key)) latest.set(key, c);
  }

  let expired = 0;
  let reminded = 0;

  for (const cert of latest.values()) {
    const expiresAt = cert.expires_at ? new Date(cert.expires_at) : null;
    const learner = refs.users.get(cert.user_id);
    const courseTitle = refs.courses.get(cert.course_id) ?? "a course";
    const recipients = new Set(
      [learner?.email, ...orgAdminEmails(refs, cert.organisation_id)].filter(
        Boolean,
      ) as string[],
    );

    if (isExpired(expiresAt, now)) {
      // Flip the enrolment back to required-again (only if not already).
      const { data: enrolment } = await admin
        .from("enrolments")
        .select("id, status")
        .eq("user_id", cert.user_id)
        .eq("course_id", cert.course_id)
        .maybeSingle();
      if (enrolment && enrolment.status !== "expired") {
        expired += 1;
        if (!dryRun) {
          await admin
            .from("enrolments")
            .update({ status: "expired" })
            .eq("id", enrolment.id);
        }
        for (const to of recipients) {
          await deliver(
            admin,
            {
              orgId: cert.organisation_id,
              to,
              type: "required_again",
              subject: `Training expired: ${courseTitle}`,
              html: wrap(
                "Training required again",
                `<p><strong>${courseTitle}</strong> has expired for ${learner?.name}. It now needs to be retaken.</p>`,
              ),
            },
            dryRun,
          );
        }
      }
      continue;
    }

    if (!expiresAt) continue;
    const stage = renewalStage(expiresAt, now, settings.renewalWindows);
    const sentStages = (cert.reminders_sent as string[]) ?? [];
    if (stage && !sentStages.includes(String(stage))) {
      reminded += 1;
      for (const to of recipients) {
        await deliver(
          admin,
          {
            orgId: cert.organisation_id,
            to,
            type: "renewal",
            subject: `Renewal due in ${stage} days: ${courseTitle}`,
            html: wrap(
              "Renewal approaching",
              `<p><strong>${courseTitle}</strong> for ${learner?.name} expires on ${expiresAt.toLocaleDateString("en-GB")} (within ${stage} days). Please arrange a retake.</p>`,
            ),
          },
          dryRun,
        );
      }
      if (!dryRun) {
        await admin
          .from("certificates")
          .update({ reminders_sent: [...sentStages, String(stage)] })
          .eq("id", cert.id);
      }
    }
  }

  return { certificatesExpired: expired, renewalRemindersSent: reminded };
}

/** Learner reminders for assigned-but-not-started and overdue courses. */
export async function processReminders(
  settings: EngineSettings,
  now: Date,
  dryRun: boolean,
): Promise<RunSummary> {
  const admin = createAdminClient();
  const refs = await loadRefs(admin);

  const { data: enrolments } = await admin
    .from("enrolments")
    .select("id, user_id, course_id, organisation_id, status, due_date, last_reminder_at");

  let sent = 0;
  for (const e of enrolments ?? []) {
    const needs =
      e.status === "not_started" || isOverdue(e.due_date, e.status, now);
    if (!needs) continue;
    const since = daysSince(
      e.last_reminder_at ? new Date(e.last_reminder_at) : null,
      now,
    );
    if (since < settings.reminderRepeatDays) continue;

    const learner = refs.users.get(e.user_id);
    if (!learner?.email || learner.status !== "active") continue;
    const courseTitle = refs.courses.get(e.course_id) ?? "a course";
    const overdue = isOverdue(e.due_date, e.status, now);

    sent += 1;
    await deliver(
      admin,
      {
        orgId: e.organisation_id,
        to: learner.email,
        type: "reminder",
        subject: overdue
          ? `Overdue training: ${courseTitle}`
          : `Training to complete: ${courseTitle}`,
        html: wrap(
          overdue ? "Training overdue" : "Training assigned",
          `<p>You have ${overdue ? "<strong>overdue</strong> " : ""}training to complete: <strong>${courseTitle}</strong>${e.due_date ? ` (due ${new Date(e.due_date).toLocaleDateString("en-GB")})` : ""}.</p>`,
        ),
      },
      dryRun,
    );
    if (!dryRun) {
      await admin
        .from("enrolments")
        .update({ last_reminder_at: now.toISOString() })
        .eq("id", e.id);
    }
  }

  return { learnerRemindersSent: sent };
}

/** Alert platform_admins when an org's completion rate drops below threshold. */
export async function processEngagement(
  settings: EngineSettings,
  now: Date,
  dryRun: boolean,
): Promise<RunSummary> {
  const admin = createAdminClient();
  const refs = await loadRefs(admin);

  const { data: enrolments } = await admin
    .from("enrolments")
    .select("organisation_id, status");

  const byOrg = new Map<string, { total: number; completed: number }>();
  for (const e of enrolments ?? []) {
    const s = byOrg.get(e.organisation_id) ?? { total: 0, completed: 0 };
    s.total += 1;
    if (e.status === "completed") s.completed += 1;
    byOrg.set(e.organisation_id, s);
  }

  const recipients = platformAdminEmails(refs);
  let alerts = 0;
  for (const [orgId, s] of byOrg) {
    if (s.total < 3) continue; // ignore tiny samples
    const rate = engagementRate(s.total, s.completed);
    if (rate >= settings.engagementThreshold) continue;

    // Dedup: skip if we alerted for this org in the last 7 days.
    const weekAgo = new Date(now.getTime() - 7 * 86_400_000).toISOString();
    const { count } = await admin
      .from("email_log")
      .select("id", { count: "exact", head: true })
      .eq("organisation_id", orgId)
      .eq("type", "engagement_alert")
      .gte("created_at", weekAgo);
    if ((count ?? 0) > 0) continue;

    const orgName = refs.orgs.get(orgId) ?? "An organisation";
    alerts += 1;
    for (const to of recipients) {
      await deliver(
        admin,
        {
          orgId,
          to,
          type: "engagement_alert",
          subject: `Low engagement: ${orgName} (${rate}%)`,
          html: wrap(
            "Engagement alert",
            `<p><strong>${orgName}</strong> has a completion rate of ${rate}% (threshold ${settings.engagementThreshold}%). Consider reaching out.</p>`,
          ),
        },
        dryRun,
      );
    }
  }

  return { engagementAlertsSent: alerts };
}

/** Weekly digest to each org_admin: completions this week, overdue, low-engagement staff. */
export async function processWeeklyDigest(
  now: Date,
  dryRun: boolean,
): Promise<RunSummary> {
  const admin = createAdminClient();
  const refs = await loadRefs(admin);
  const weekAgo = new Date(now.getTime() - 7 * 86_400_000);

  const [{ data: enrolments }, { data: certs }] = await Promise.all([
    admin.from("enrolments").select("organisation_id, user_id, status, due_date"),
    admin.from("certificates").select("organisation_id, issued_at"),
  ]);

  let digests = 0;
  for (const [orgId, orgName] of refs.orgs) {
    const admins = orgAdminEmails(refs, orgId);
    if (admins.length === 0) continue;

    const orgEnrolments = (enrolments ?? []).filter(
      (e) => e.organisation_id === orgId,
    );
    if (orgEnrolments.length === 0) continue;

    const completionsThisWeek = (certs ?? []).filter(
      (c) => c.organisation_id === orgId && new Date(c.issued_at) >= weekAgo,
    ).length;
    const overdue = orgEnrolments.filter((e) =>
      isOverdue(e.due_date, e.status, now),
    ).length;
    const notStarted = orgEnrolments.filter(
      (e) => e.status === "not_started",
    ).length;

    digests += 1;
    for (const to of admins) {
      await deliver(
        admin,
        {
          orgId,
          to,
          type: "digest",
          subject: `Weekly training summary — ${orgName}`,
          html: wrap(
            `Weekly summary — ${orgName}`,
            `<ul>
               <li>Completions this week: <strong>${completionsThisWeek}</strong></li>
               <li>Overdue enrolments: <strong>${overdue}</strong></li>
               <li>Not yet started: <strong>${notStarted}</strong></li>
             </ul>`,
          ),
        },
        dryRun,
      );
    }
  }

  return { digestsSent: digests };
}
