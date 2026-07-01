import { beforeAll, afterAll, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  claimsOf,
  cleanup,
  createOrg,
  createUser,
  signIn,
} from "./helpers";

// Unique suffix so repeated runs don't collide on email/org names.
const RUN = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
const PW = "Test-Passw0rd!";

const email = (label: string) => `rls-${label}-${RUN}@example.test`;

let orgA: string;
let orgB: string;

const userIds: string[] = [];
const orgIds: string[] = [];

// Signed-in clients
let adminAClient: SupabaseClient; // org_admin of org A
let learnerAClient: SupabaseClient; // learner in org A
let adminBClient: SupabaseClient; // org_admin of org B
let platformClient: SupabaseClient; // platform_admin (global)

beforeAll(async () => {
  orgA = await createOrg(`Org A ${RUN}`);
  orgB = await createOrg(`Org B ${RUN}`);
  orgIds.push(orgA, orgB);

  const adminAId = await createUser({
    email: email("admin-a"),
    password: PW,
    role: "org_admin",
    organisationId: orgA,
  });
  const learnerAId = await createUser({
    email: email("learner-a"),
    password: PW,
    role: "learner",
    organisationId: orgA,
  });
  const adminBId = await createUser({
    email: email("admin-b"),
    password: PW,
    role: "org_admin",
    organisationId: orgB,
  });
  const platformId = await createUser({
    email: email("platform"),
    password: PW,
    role: "platform_admin",
    organisationId: null,
  });
  userIds.push(adminAId, learnerAId, adminBId, platformId);

  adminAClient = await signIn(email("admin-a"), PW);
  learnerAClient = await signIn(email("learner-a"), PW);
  adminBClient = await signIn(email("admin-b"), PW);
  platformClient = await signIn(email("platform"), PW);
}, 60_000);

afterAll(async () => {
  await cleanup(userIds, orgIds);
});

describe("JWT claims injected by custom_access_token_hook", () => {
  it("carries organisation_id + user_role for an org member", async () => {
    const claims = await claimsOf(adminAClient);
    expect(claims.user_role).toBe("org_admin");
    expect(claims.organisation_id).toBe(orgA);
  });

  it("has no organisation for a platform_admin", async () => {
    const claims = await claimsOf(platformClient);
    expect(claims.user_role).toBe("platform_admin");
    // Hook writes JSON null for a platform admin's org.
    expect(claims.organisation_id ?? null).toBeNull();
  });
});

describe("organisations RLS", () => {
  it("org_admin sees only their own organisation", async () => {
    const { data, error } = await adminAClient
      .from("organisations")
      .select("id, name");
    expect(error).toBeNull();
    expect(data?.map((o) => o.id)).toEqual([orgA]);
  });

  it("org_admin cannot read another org by id (cross-org read blocked)", async () => {
    const { data, error } = await adminAClient
      .from("organisations")
      .select("id")
      .eq("id", orgB);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("org_admin cannot change their own org's feature flags", async () => {
    // Only platform_admin may write orgs — feature-gating integrity.
    const { data } = await adminAClient
      .from("organisations")
      .update({ forms_enabled: true })
      .eq("id", orgA)
      .select("id");
    expect(data ?? []).toEqual([]);

    const { data: check } = await platformClient
      .from("organisations")
      .select("forms_enabled")
      .eq("id", orgA)
      .single();
    expect(check?.forms_enabled).toBe(false);
  });

  it("platform_admin sees all organisations", async () => {
    const { data, error } = await platformClient
      .from("organisations")
      .select("id")
      .in("id", [orgA, orgB]);
    expect(error).toBeNull();
    expect(data?.map((o) => o.id).sort()).toEqual([orgA, orgB].sort());
  });

  it("org_admin cannot update another org (cross-org write blocked)", async () => {
    // RLS makes the target row invisible, so 0 rows are updated.
    const { data } = await adminBClient
      .from("organisations")
      .update({ name: "hijacked" })
      .eq("id", orgA)
      .select("id");
    expect(data ?? []).toEqual([]);

    // Confirm org A is untouched.
    const { data: check } = await platformClient
      .from("organisations")
      .select("name")
      .eq("id", orgA)
      .single();
    expect(check?.name).not.toBe("hijacked");
  });
});

describe("users RLS", () => {
  it("org_admin sees only users within their own org", async () => {
    const { data, error } = await adminAClient
      .from("users")
      .select("organisation_id");
    expect(error).toBeNull();
    expect(data?.length).toBeGreaterThan(0);
    expect(data?.every((u) => u.organisation_id === orgA)).toBe(true);
  });

  it("learner sees only their own user row", async () => {
    const { data, error } = await learnerAClient.from("users").select("id");
    expect(error).toBeNull();
    expect(data?.length).toBe(1);
  });

  it("org_admin cannot insert a user into another org", async () => {
    // No insert policy applies to org_admin → RLS rejects the write.
    const { error } = await adminAClient.from("users").insert({
      id: crypto.randomUUID(),
      email: "intruder@example.test",
      role: "learner",
      organisation_id: orgB,
    });
    expect(error).not.toBeNull();
  });

  it("platform_admin sees users across all orgs", async () => {
    const { data, error } = await platformClient
      .from("users")
      .select("organisation_id")
      .in("organisation_id", [orgA, orgB]);
    expect(error).toBeNull();
    const orgs = new Set(data?.map((u) => u.organisation_id));
    expect(orgs.has(orgA)).toBe(true);
    expect(orgs.has(orgB)).toBe(true);
  });
});
