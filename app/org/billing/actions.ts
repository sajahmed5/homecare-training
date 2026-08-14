"use server";

import { requireRole } from "@/lib/auth";
import { createPasswordReset } from "@/lib/invites";

// Plan changes are owner-only (design doc v2): the self-serve checkout and
// Stripe portal actions were removed — org admins see billing read-only, and
// upgrades/downgrades happen through the platform owner.

export interface ResetState {
  ok?: boolean;
  error?: string;
}

/** Email the signed-in org admin a password-reset link for their own account. */
export async function sendMyPasswordResetAction(): Promise<ResetState> {
  const context = await requireRole("org_admin");
  if (!context.email) return { ok: false, error: "No email on your account." };
  try {
    await createPasswordReset(context.email);
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Could not send the reset email.",
    };
  }
}
