"use server";

import { getUserContext } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";

/** UK-GDPR: a learner exports all of their own data as JSON. */
export async function exportMyDataAction(): Promise<{
  data?: Record<string, unknown>;
  error?: string;
}> {
  const context = await getUserContext();
  if (!context) return { error: "Not signed in." };

  const admin = createAdminClient();
  const [{ data: profile }, { data: enrolments }, { data: certificates }, { data: attempts }] =
    await Promise.all([
      admin.from("users").select("*").eq("id", context.userId).single(),
      admin.from("enrolments").select("*").eq("user_id", context.userId),
      admin.from("certificates").select("*").eq("user_id", context.userId),
      admin
        .from("quiz_attempts")
        .select("id, course_id, score, passed, started_at, submitted_at")
        .eq("user_id", context.userId),
    ]);

  return {
    data: {
      exported_at: new Date().toISOString(),
      profile,
      enrolments,
      certificates,
      quiz_attempts: attempts,
    },
  };
}

/** UK-GDPR: a learner permanently deletes their own account (cascades). */
export async function deleteMyAccountAction(): Promise<{
  ok: boolean;
  error?: string;
}> {
  const context = await getUserContext();
  if (!context) return { ok: false, error: "Not signed in." };
  if (context.role !== "learner") {
    return {
      ok: false,
      error: "Admins must be removed by another administrator.",
    };
  }

  await logAudit({
    context,
    action: "account.self_deleted",
    entity: "user",
    entityId: context.userId,
  });

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(context.userId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
