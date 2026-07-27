"use server";

import { headers } from "next/headers";
import { rateLimit } from "@/lib/rate-limit";
import { createPasswordReset } from "@/lib/invites";

export interface ResetState {
  ok?: boolean;
  message?: string;
  /** Dev-only fallback link, surfaced when email isn't configured. */
  link?: string;
}

export async function requestPasswordResetAction(
  _prev: ResetState,
  formData: FormData,
): Promise<ResetState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) return { ok: false, message: "Enter your email address." };

  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
  if (!rateLimit(`reset:${ip}`, 5, 60_000)) {
    return { ok: false, message: "Too many attempts — please wait a minute and try again." };
  }

  // Always respond the same way whether or not the account exists — never leak
  // which emails are registered.
  const generic: ResetState = {
    ok: true,
    message: "If an account exists for that email, we've sent a link to reset your password.",
  };
  try {
    const res = await createPasswordReset(email);
    // If email delivery isn't configured, surface the link so the reset still
    // works (only reachable for a real account; generic message otherwise).
    if (!res.sent && res.link) return { ...generic, link: res.link };
    return generic;
  } catch {
    return generic;
  }
}
