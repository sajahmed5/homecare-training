import { afterAll, describe, expect, it } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { adminClient, cleanup, createOrg, createUser } from "./helpers";

const RUN = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const PW = "Test-Passw0rd!";

const userIds: string[] = [];
const orgIds: string[] = [];

afterAll(async () => {
  await cleanup(userIds, orgIds);
});

function anon() {
  return createClient(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

describe("staff deactivation", () => {
  it("blocks a deactivated user from signing in and restores on reactivation", async () => {
    const admin = adminClient();
    const orgId = await createOrg(`Staff Org ${RUN}`);
    orgIds.push(orgId);

    const email = `staff-${RUN}@example.test`;
    const id = await createUser({
      email,
      password: PW,
      role: "learner",
      organisationId: orgId,
    });
    userIds.push(id);

    // Baseline: the learner can sign in.
    const { error: before } = await anon().auth.signInWithPassword({
      email,
      password: PW,
    });
    expect(before).toBeNull();

    // Deactivate: set status + ban at the auth layer (what the action does).
    await admin.from("users").update({ status: "deactivated" }).eq("id", id);
    await admin.auth.admin.updateUserById(id, { ban_duration: "876000h" });

    const { data: profile } = await admin
      .from("users")
      .select("status")
      .eq("id", id)
      .single();
    expect(profile?.status).toBe("deactivated");

    // Deactivated user can no longer sign in.
    const { error: blocked } = await anon().auth.signInWithPassword({
      email,
      password: PW,
    });
    expect(blocked).not.toBeNull();

    // Reactivate restores access.
    await admin.from("users").update({ status: "active" }).eq("id", id);
    await admin.auth.admin.updateUserById(id, { ban_duration: "none" });

    const { error: after } = await anon().auth.signInWithPassword({
      email,
      password: PW,
    });
    expect(after).toBeNull();
  });
});
