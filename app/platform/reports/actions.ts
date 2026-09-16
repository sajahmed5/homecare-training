"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { sendEmail } from "@/lib/email";
import { siteOrigin } from "@/lib/site-url";
import { reportChanged, reportUpdateEmail } from "@/lib/report-email";
import { REPORT_STATUSES, type ReportStatus } from "./status";

export interface UpdateReportResult {
  ok: boolean;
  error?: string;
  /** What happened about telling the reporter, in words for the form. */
  emailed?: "sent" | "failed" | "not_asked" | "no_change" | "no_reporter";
}

/**
 * Update an issue report's status and note (platform_admin only), and tell
 * the person who reported it (issue #41) — unless the box was unticked,
 * nothing changed, or their account is gone or deactivated.
 */
export async function updateReportAction(input: {
  id: string;
  status: ReportStatus;
  adminNote?: string;
  notify?: boolean;
}): Promise<UpdateReportResult> {
  const context = await requireRole("platform_admin");

  if (!REPORT_STATUSES.includes(input.status)) {
    return { ok: false, error: "Invalid status." };
  }

  const admin = createAdminClient();
  const { data: before } = await admin
    .from("issue_reports")
    .select("report_no, summary, status, admin_note, user_id, organisation_id")
    .eq("id", input.id)
    .maybeSingle();
  if (!before) return { ok: false, error: "That report no longer exists." };

  const note = input.adminNote?.trim().slice(0, 5000) || null;
  const { error } = await admin
    .from("issue_reports")
    .update({ status: input.status, admin_note: note })
    .eq("id", input.id);

  if (error) return { ok: false, error: error.message };

  const change = {
    reportNo: Number(before.report_no),
    summary: before.summary as string,
    prevStatus: before.status as string,
    status: input.status,
    prevNote: before.admin_note as string | null,
    note,
  };

  let emailed: UpdateReportResult["emailed"] = "not_asked";
  if (!reportChanged(change)) {
    emailed = "no_change";
  } else if (input.notify) {
    const { data: reporter } = before.user_id
      ? await admin
          .from("users")
          .select("email, full_name, status")
          .eq("id", before.user_id)
          .maybeSingle()
      : { data: null };
    if (!reporter?.email || reporter.status === "deactivated") {
      emailed = "no_reporter";
    } else {
      const { subject, html } = reportUpdateEmail(
        reporter.full_name,
        change,
        await siteOrigin(),
      );
      const sent = await sendEmail({ to: reporter.email, subject, html });
      await admin.from("email_log").insert({
        organisation_id: before.organisation_id,
        to_email: reporter.email,
        type: "issue_report_update",
        subject,
        sent,
      });
      emailed = sent ? "sent" : "failed";
    }
  }

  await logAudit({
    context,
    action: "issue_report.updated",
    entity: "issue_report",
    entityId: input.id,
    detail: { status: input.status, emailed },
  });

  revalidatePath(`/platform/reports/${input.id}`);
  revalidatePath("/platform/reports");
  revalidatePath("/report");
  return { ok: true, emailed };
}
