"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createInvite } from "@/lib/invites";
import type { InviteState, SaveState } from "@/app/platform/actions";
import type { UserRole } from "@/lib/auth";

const INVITABLE_ROLES: UserRole[] = ["learner", "org_admin"];
const ROLE_LABELS: Record<string, string> = {
  learner: "learner",
  org_admin: "organisation administrator",
};

/** org_admin invites a learner or another org_admin into their own organisation. */
export async function inviteStaffAction(
  _prev: InviteState,
  formData: FormData,
): Promise<InviteState> {
  const context = await requireRole("org_admin");

  const email = String(formData.get("email") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "learner") as UserRole;

  if (!email) return { ok: false, error: "Email is required." };
  if (!INVITABLE_ROLES.includes(role)) {
    return { ok: false, error: "Invalid role." };
  }
  if (!context.organisationId) {
    return { ok: false, error: "Your account has no organisation." };
  }

  try {
    const result = await createInvite({
      email,
      role,
      organisationId: context.organisationId,
      fullName: name,
      roleLabel: ROLE_LABELS[role],
    });
    revalidatePath("/org");
    return {
      ok: true,
      sent: result.sent,
      link: result.sent ? undefined : result.link,
      email,
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to send invite.",
    };
  }
}

/** Deactivate or reactivate a staff member within the caller's organisation. */
export async function setStaffStatusAction(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const context = await requireRole("org_admin");

  const userId = String(formData.get("userId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!["active", "deactivated"].includes(status)) {
    return { ok: false, error: "Invalid status." };
  }
  if (userId === context.userId) {
    return { ok: false, error: "You cannot change your own status." };
  }

  const admin = createAdminClient();

  // Scope check: the target must belong to the caller's organisation.
  const { data: target } = await admin
    .from("users")
    .select("organisation_id")
    .eq("id", userId)
    .single();
  if (!target || target.organisation_id !== context.organisationId) {
    return { ok: false, error: "Staff member not found in your organisation." };
  }

  const { error } = await admin
    .from("users")
    .update({ status })
    .eq("id", userId);
  if (error) return { ok: false, error: error.message };

  // Also block/unblock at the auth layer.
  await admin.auth.admin.updateUserById(userId, {
    ban_duration: status === "deactivated" ? "876000h" : "none",
  });

  revalidatePath("/org");
  return { ok: true };
}

export interface BulkState {
  ok?: boolean;
  error?: string;
  created?: number;
  failures?: { email: string; error: string }[];
}

/** Bulk-invite staff from parsed CSV rows (name,email,role). */
export async function bulkInviteStaffAction(
  _prev: BulkState,
  formData: FormData,
): Promise<BulkState> {
  const context = await requireRole("org_admin");
  if (!context.organisationId) {
    return { ok: false, error: "Your account has no organisation." };
  }

  let rows: { name?: string; email?: string; role?: string }[];
  try {
    rows = JSON.parse(String(formData.get("rows") ?? "[]"));
  } catch {
    return { ok: false, error: "Could not read the CSV." };
  }
  if (!Array.isArray(rows) || rows.length === 0) {
    return { ok: false, error: "No rows found in the CSV." };
  }

  let created = 0;
  const failures: { email: string; error: string }[] = [];

  for (const row of rows) {
    const email = (row.email ?? "").trim();
    const role = (row.role ?? "learner").trim() as UserRole;
    if (!email) continue;
    if (!INVITABLE_ROLES.includes(role)) {
      failures.push({ email, error: `Invalid role "${role}"` });
      continue;
    }
    try {
      await createInvite({
        email,
        role,
        organisationId: context.organisationId,
        fullName: (row.name ?? "").trim(),
        roleLabel: ROLE_LABELS[role],
      });
      created += 1;
    } catch (e) {
      failures.push({
        email,
        error: e instanceof Error ? e.message : "Failed",
      });
    }
  }

  revalidatePath("/org");
  return { ok: true, created, failures };
}

export interface AssignState {
  ok?: boolean;
  error?: string;
  count?: number;
}

/**
 * Assign a course or a whole pathway to staff, with an optional due date.
 * Creates enrolments (idempotent — re-assigning keeps existing progress).
 */
export async function assignTrainingAction(
  _prev: AssignState,
  formData: FormData,
): Promise<AssignState> {
  const context = await requireRole("org_admin");
  if (!context.organisationId) {
    return { ok: false, error: "Your account has no organisation." };
  }

  const target = String(formData.get("target") ?? "");
  const dueDate = String(formData.get("dueDate") ?? "").trim() || null;
  const userIds = formData.getAll("userIds").map(String);

  if (!target) return { ok: false, error: "Choose a course or pathway." };
  if (userIds.length === 0) {
    return { ok: false, error: "Select at least one staff member." };
  }

  const [kind, id] = target.split(":");
  const supabase = await createClient();

  // Resolve to a concrete set of course ids.
  let courseIds: string[] = [];
  if (kind === "course") {
    courseIds = [id];
  } else if (kind === "pathway") {
    const { data } = await supabase
      .from("pathway_courses")
      .select("course_id")
      .eq("pathway_id", id);
    courseIds = (data ?? []).map((r) => r.course_id as string);
  }
  if (courseIds.length === 0) {
    return { ok: false, error: "No courses found for that selection." };
  }

  // RLS scopes this read to the caller's org, so it validates org membership.
  const { data: orgUsers } = await supabase
    .from("users")
    .select("id")
    .in("id", userIds);
  const valid = new Set((orgUsers ?? []).map((u) => u.id as string));

  const rows = [];
  for (const uid of userIds) {
    if (!valid.has(uid)) continue;
    for (const cid of courseIds) {
      rows.push({
        organisation_id: context.organisationId,
        user_id: uid,
        course_id: cid,
        due_date: dueDate,
      });
    }
  }
  if (rows.length === 0) {
    return { ok: false, error: "No valid staff selected." };
  }

  const { error } = await supabase
    .from("enrolments")
    .upsert(rows, { onConflict: "user_id,course_id" });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/org");
  revalidatePath("/learn");
  return { ok: true, count: rows.length };
}
