"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createInvite } from "@/lib/invites";
import { logAudit } from "@/lib/audit";
import { endOfMonthISO, type AssignCsvRow } from "@/lib/assign";
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
    await logAudit({
      context,
      action: "user.invited",
      entity: "user",
      detail: { email, role },
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

  await logAudit({
    context,
    action: status === "deactivated" ? "staff.deactivated" : "staff.reactivated",
    entity: "user",
    entityId: userId,
  });

  revalidatePath("/org");
  return { ok: true };
}

/** Permanently delete a staff member from the caller's organisation (issue #14). */
export async function deleteStaffAction(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const context = await requireRole("org_admin");

  const userId = String(formData.get("userId") ?? "");
  if (!userId) return { ok: false, error: "Missing staff member." };
  if (userId === context.userId) {
    return { ok: false, error: "You cannot delete your own account." };
  }

  const admin = createAdminClient();

  // Scope check: the target must belong to the caller's organisation.
  const { data: target } = await admin
    .from("users")
    .select("organisation_id, email, role")
    .eq("id", userId)
    .single();
  if (!target || target.organisation_id !== context.organisationId) {
    return { ok: false, error: "Staff member not found in your organisation." };
  }

  // Deleting the auth user cascades to the profile and their training records.
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return { ok: false, error: error.message };

  await logAudit({
    context,
    action: "staff.deleted",
    entity: "user",
    entityId: userId,
    detail: { email: target.email, role: target.role },
  });

  revalidatePath("/org");
  revalidatePath("/org/learners");
  return { ok: true };
}

export interface BulkState {
  ok?: boolean;
  error?: string;
  created?: number;
  failures?: { email: string; error: string }[];
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  const admin = createAdminClient();
  let created = 0;
  const failures: { email: string; error: string }[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    const email = (row.email ?? "").trim().toLowerCase();
    const role = ((row.role ?? "learner").trim().toLowerCase() || "learner") as UserRole;
    if (!email) continue;
    if (seen.has(email)) continue; // duplicate row in the file
    seen.add(email);
    if (!EMAIL_RE.test(email)) {
      failures.push({ email, error: "Not a valid email address" });
      continue;
    }
    if (!INVITABLE_ROLES.includes(role)) {
      failures.push({ email, error: `Invalid role "${role}"` });
      continue;
    }
    try {
      const invite = await createInvite({
        email,
        role,
        organisationId: context.organisationId,
        fullName: (row.name ?? "").trim(),
        roleLabel: ROLE_LABELS[role],
      });

      // Belt and braces (issue #16): confirm the profile row exists with the
      // right organisation — the DB trigger normally creates it, but if it
      // didn't, repair it here so the person can't end up org-less.
      if (invite.userId) {
        const { data: profile } = await admin
          .from("users")
          .select("id, organisation_id")
          .eq("id", invite.userId)
          .maybeSingle();
        if (!profile) {
          await admin.from("users").insert({
            id: invite.userId,
            email,
            full_name: (row.name ?? "").trim() || email,
            role,
            organisation_id: context.organisationId,
          });
        } else if (!profile.organisation_id) {
          await admin
            .from("users")
            .update({ organisation_id: context.organisationId, role })
            .eq("id", invite.userId);
        }
      }
      created += 1;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed";
      failures.push({
        email,
        error: /already.*(registered|exists)/i.test(msg)
          ? "Already has an account"
          : msg,
      });
    }
  }

  await logAudit({
    context,
    action: "staff.bulk_invited",
    entity: "user",
    detail: { created, failed: failures.length },
  });

  revalidatePath("/org");
  revalidatePath("/org/learners");
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

  // Every assignment carries a due date; default is end of the current month.
  const dueDate = String(formData.get("dueDate") ?? "").trim() || endOfMonthISO();
  const pathwayId = String(formData.get("pathway") ?? "").trim();
  const selectedCourseIds = formData.getAll("courseIds").map(String).filter(Boolean);
  const allCarers = String(formData.get("all") ?? "") !== "";
  const selectedUserIds = formData.getAll("userIds").map(String);

  const supabase = await createClient();

  // Resolve to a concrete set of course ids (selected courses ∪ pathway courses).
  const courseIdSet = new Set<string>(selectedCourseIds);
  if (pathwayId) {
    const { data } = await supabase
      .from("pathway_courses")
      .select("course_id")
      .eq("pathway_id", pathwayId);
    for (const r of data ?? []) courseIdSet.add(r.course_id as string);
  }
  const courseIds = [...courseIdSet];
  if (courseIds.length === 0) {
    return { ok: false, error: "Choose at least one course or a pathway." };
  }

  // Resolve the target learners. "All carers" = every active learner in the org
  // (RLS scopes the read to the caller's org).
  let userIds: string[];
  if (allCarers) {
    const { data } = await supabase
      .from("users")
      .select("id")
      .eq("role", "learner")
      .eq("status", "active");
    userIds = (data ?? []).map((u) => u.id as string);
  } else {
    if (selectedUserIds.length === 0) {
      return { ok: false, error: "Select at least one carer, or tick 'all carers'." };
    }
    const { data: orgUsers } = await supabase
      .from("users")
      .select("id")
      .in("id", selectedUserIds);
    userIds = (orgUsers ?? []).map((u) => u.id as string);
  }
  if (userIds.length === 0) {
    return { ok: false, error: "No valid carers selected." };
  }

  const rows = [];
  for (const uid of userIds) {
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

export interface BulkAssignState {
  ok?: boolean;
  error?: string;
  assigned?: number;
  failures?: { line: string; error: string }[];
}

/**
 * Bulk-assign courses from parsed CSV rows (email, course title, optional due
 * date — defaults to end of the current month). Upserts enrolments, so
 * re-running a file never wipes progress.
 */
export async function bulkAssignTrainingAction(
  _prev: BulkAssignState,
  formData: FormData,
): Promise<BulkAssignState> {
  const context = await requireRole("org_admin");
  if (!context.organisationId) {
    return { ok: false, error: "Your account has no organisation." };
  }

  let rows: AssignCsvRow[];
  try {
    rows = JSON.parse(String(formData.get("rows") ?? "[]"));
  } catch {
    return { ok: false, error: "Could not read the CSV." };
  }
  if (!Array.isArray(rows) || rows.length === 0) {
    return { ok: false, error: "No rows found in the CSV." };
  }

  const supabase = await createClient();
  const [{ data: users }, { data: courses }] = await Promise.all([
    supabase.from("users").select("id, email").eq("role", "learner"),
    supabase.from("courses").select("id, title"),
  ]);
  const userByEmail = new Map(
    (users ?? []).map((u) => [String(u.email).toLowerCase(), u.id as string]),
  );
  const courseByTitle = new Map(
    (courses ?? []).map((c) => [String(c.title).toLowerCase(), c.id as string]),
  );

  const defaultDue = endOfMonthISO();
  const upserts = [];
  const failures: { line: string; error: string }[] = [];
  for (const row of rows) {
    const line = `${row.email} → ${row.course}`;
    if (row.problem) {
      failures.push({ line, error: row.problem });
      continue;
    }
    const userId = userByEmail.get(row.email.toLowerCase());
    if (!userId) {
      failures.push({ line, error: "No learner with that email in your organisation" });
      continue;
    }
    const courseId = courseByTitle.get(row.course.toLowerCase());
    if (!courseId) {
      failures.push({ line, error: "No course with that exact title" });
      continue;
    }
    upserts.push({
      organisation_id: context.organisationId,
      user_id: userId,
      course_id: courseId,
      due_date: row.dueDate ?? defaultDue,
    });
  }

  if (upserts.length > 0) {
    const { error } = await supabase
      .from("enrolments")
      .upsert(upserts, { onConflict: "user_id,course_id" });
    if (error) return { ok: false, error: error.message, failures };
  }

  await logAudit({
    context,
    action: "training.bulk_assigned",
    entity: "enrolment",
    detail: { assigned: upserts.length, failed: failures.length },
  });

  revalidatePath("/org");
  revalidatePath("/learn");
  return { ok: true, assigned: upserts.length, failures };
}
