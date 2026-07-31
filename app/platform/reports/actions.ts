"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { REPORT_STATUSES, type ReportStatus } from "./status";

/** Update an issue report's status and admin note (platform_admin only). */
export async function updateReportAction(input: {
  id: string;
  status: ReportStatus;
  adminNote?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const context = await requireRole("platform_admin");

  if (!REPORT_STATUSES.includes(input.status)) {
    return { ok: false, error: "Invalid status." };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("issue_reports")
    .update({
      status: input.status,
      admin_note: input.adminNote?.trim().slice(0, 5000) || null,
    })
    .eq("id", input.id);

  if (error) return { ok: false, error: error.message };

  await logAudit({
    context,
    action: "issue_report.updated",
    entity: "issue_report",
    entityId: input.id,
    detail: { status: input.status },
  });

  revalidatePath(`/platform/reports/${input.id}`);
  revalidatePath("/platform/reports");
  return { ok: true };
}
