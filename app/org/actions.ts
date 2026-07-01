"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createInvite } from "@/lib/invites";
import type { InviteState } from "@/app/platform/actions";

/** org_admin invites a learner into their own organisation. */
export async function inviteLearnerAction(
  _prev: InviteState,
  formData: FormData,
): Promise<InviteState> {
  const context = await requireRole("org_admin");

  const email = String(formData.get("email") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();

  if (!email) return { ok: false, error: "Email is required." };
  if (!context.organisationId) {
    return { ok: false, error: "Your account has no organisation." };
  }

  try {
    const result = await createInvite({
      email,
      role: "learner",
      organisationId: context.organisationId,
      fullName: name,
      roleLabel: "learner",
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
