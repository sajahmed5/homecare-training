import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendInviteEmail, type SendResult } from "@/lib/email";
import type { UserRole } from "@/lib/auth";

/** Absolute origin for building invite links (works in dev and prod). */
async function siteOrigin(): Promise<string> {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

/**
 * Generates a Supabase invite link (creating the auth user with role/org in its
 * metadata, which the handle_new_user trigger turns into a profile) and emails
 * it. The invitee accepts at /auth/confirm, then sets a password.
 */
export async function createInvite(opts: {
  email: string;
  role: UserRole;
  organisationId: string | null;
  fullName?: string;
  orgName?: string | null;
  roleLabel: string;
}): Promise<SendResult> {
  const admin = createAdminClient();
  const origin = await siteOrigin();

  const { data, error } = await admin.auth.admin.generateLink({
    type: "invite",
    email: opts.email,
    options: {
      data: {
        role: opts.role,
        organisation_id: opts.organisationId,
        full_name: opts.fullName || opts.email,
      },
    },
  });
  if (error) throw error;

  const tokenHash = data.properties?.hashed_token;
  if (!tokenHash) throw new Error("Failed to generate invite token.");

  const inviteUrl =
    `${origin}/auth/confirm?token_hash=${tokenHash}` +
    `&type=invite&next=/auth/set-password`;

  return sendInviteEmail({
    to: opts.email,
    inviteUrl,
    roleLabel: opts.roleLabel,
    orgName: opts.orgName,
  });
}
