"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createInvite } from "@/lib/invites";

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
