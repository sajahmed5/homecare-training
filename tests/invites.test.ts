import { afterAll, describe, expect, it } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { adminClient, cleanup, createOrg } from "./helpers";

const RUN = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const userIds: string[] = [];
const orgIds: string[] = [];

afterAll(async () => {
  await cleanup(userIds, orgIds);
});

describe("invite flow (generateLink -> verifyOtp -> profile)", () => {
  it("provisions an org_admin with the correct role and org from the invite", async () => {
    const admin = adminClient();
    const orgId = await createOrg(`Invite Org ${RUN}`);
    orgIds.push(orgId);

    const email = `invitee-${RUN}@example.test`;

    // 1. Platform side: generate an invite carrying role + org in metadata.
    const { data: link, error: linkError } =
      await admin.auth.admin.generateLink({
        type: "invite",
        email,
        options: {
          data: {
            role: "org_admin",
            organisation_id: orgId,
            full_name: "Invited Admin",
          },
        },
      });
    expect(linkError).toBeNull();
    const tokenHash = link!.properties!.hashed_token;
    expect(tokenHash).toBeTruthy();

    // 2. Invitee side: accept the invite by verifying the token.
    const client = createClient(SUPABASE_URL, ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: verified, error: verifyError } = await client.auth.verifyOtp({
      type: "invite",
      token_hash: tokenHash,
    });
    expect(verifyError).toBeNull();
    expect(verified.user).toBeTruthy();
    userIds.push(verified.user!.id);

    // 3. Their JWT carries the injected claims.
    const {
      data: { session },
    } = await client.auth.getSession();
    const claims = JSON.parse(
      Buffer.from(session!.access_token.split(".")[1], "base64").toString(),
    );
    expect(claims.user_role).toBe("org_admin");
    expect(claims.organisation_id).toBe(orgId);

    // 4. The profile row exists with the right role + org (read via RLS as them).
    const { data: profile, error: profileError } = await client
      .from("users")
      .select("role, organisation_id, email")
      .eq("id", verified.user!.id)
      .single();
    expect(profileError).toBeNull();
    expect(profile).toMatchObject({
      role: "org_admin",
      organisation_id: orgId,
      email,
    });
  });
});
