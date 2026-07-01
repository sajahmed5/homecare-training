"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createInvite } from "@/lib/invites";
import { logAudit } from "@/lib/audit";
import { PACKAGE_TIERS, ORG_STATUSES } from "@/lib/organisations";

export interface InviteState {
  ok?: boolean;
  error?: string;
  /** Present when email isn't configured — shown as a copyable link. */
  link?: string;
  sent?: boolean;
  email?: string;
}

/**
 * platform_admin invites a new organisation: creates the org and sends its
 * first org_admin an invite. Rolls the org back if the invite fails.
 */
export async function inviteOrganisationAction(
  _prev: InviteState,
  formData: FormData,
): Promise<InviteState> {
  await requireRole("platform_admin");

  const orgName = String(formData.get("orgName") ?? "").trim();
  const adminEmail = String(formData.get("adminEmail") ?? "").trim();
  const adminName = String(formData.get("adminName") ?? "").trim();

  if (!orgName || !adminEmail) {
    return { ok: false, error: "Organisation name and admin email are required." };
  }

  const admin = createAdminClient();
  const { data: org, error } = await admin
    .from("organisations")
    .insert({ name: orgName })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };

  try {
    const result = await createInvite({
      email: adminEmail,
      role: "org_admin",
      organisationId: org.id,
      fullName: adminName,
      orgName,
      roleLabel: "organisation administrator",
    });
    revalidatePath("/platform");
    return {
      ok: true,
      sent: result.sent,
      link: result.sent ? undefined : result.link,
      email: adminEmail,
    };
  } catch (e) {
    // Invite failed (e.g. email already in use) — undo the org we just created.
    await admin.from("organisations").delete().eq("id", org.id);
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to send invite.",
    };
  }
}

export interface SaveState {
  ok?: boolean;
  error?: string;
}

/** Update an organisation's name, tier, feature flags and status. */
export async function updateOrganisationAction(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const context = await requireRole("platform_admin");

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const packageTier = String(formData.get("package_tier") ?? "");
  const status = String(formData.get("status") ?? "");
  const formsEnabled = formData.get("forms_enabled") === "true";
  const recruitmentEnabled = formData.get("recruitment_enabled") === "true";

  if (!id) return { ok: false, error: "Missing organisation id." };
  if (!name) return { ok: false, error: "Name is required." };
  if (!PACKAGE_TIERS.some((t) => t.value === packageTier)) {
    return { ok: false, error: "Invalid package tier." };
  }
  if (!ORG_STATUSES.some((s) => s.value === status)) {
    return { ok: false, error: "Invalid status." };
  }

  // Updates go through RLS — only a platform_admin can write any org.
  const supabase = await createClient();
  const { error } = await supabase
    .from("organisations")
    .update({
      name,
      package_tier: packageTier,
      status,
      forms_enabled: formsEnabled,
      recruitment_enabled: recruitmentEnabled,
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  await logAudit({
    context,
    organisationId: id,
    action: "organisation.updated",
    entity: "organisation",
    entityId: id,
    detail: {
      package_tier: packageTier,
      status,
      forms_enabled: formsEnabled,
      recruitment_enabled: recruitmentEnabled,
    },
  });

  revalidatePath("/platform");
  revalidatePath(`/platform/organisations/${id}`);
  return { ok: true };
}

/** Invite another platform_admin (global, no organisation). */
export async function invitePlatformAdminAction(
  _prev: InviteState,
  formData: FormData,
): Promise<InviteState> {
  await requireRole("platform_admin");

  const email = String(formData.get("email") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  if (!email) return { ok: false, error: "Email is required." };

  try {
    const result = await createInvite({
      email,
      role: "platform_admin",
      organisationId: null,
      fullName: name,
      roleLabel: "platform administrator",
    });
    revalidatePath("/platform");
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
