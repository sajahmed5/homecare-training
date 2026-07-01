import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { adminClient, cleanup, createOrg, createUser, signIn } from "./helpers";

// A foreign org_admin must see NONE of another org's data across every
// tenant-scoped table — the core multi-tenancy guarantee.

const RUN = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
const PW = "Test-Passw0rd!";
const email = (l: string) => `sec-${l}-${RUN}@example.test`;

let orgA: string;
let orgB: string;
let formId: string;
let candidateId: string;

const userIds: string[] = [];
const orgIds: string[] = [];
let adminB: SupabaseClient;

beforeAll(async () => {
  const admin = adminClient();
  orgA = await createOrg(`Sec A ${RUN}`);
  orgB = await createOrg(`Sec B ${RUN}`);
  orgIds.push(orgA, orgB);
  // Both orgs entitled, so denials are org-scoping (not just feature gating).
  for (const id of [orgA, orgB]) {
    await admin
      .from("organisations")
      .update({ forms_enabled: true, recruitment_enabled: true })
      .eq("id", id);
  }

  const aAdmin = await createUser({ email: email("a"), password: PW, role: "org_admin", organisationId: orgA });
  const bAdmin = await createUser({ email: email("b"), password: PW, role: "org_admin", organisationId: orgB });
  userIds.push(aAdmin, bAdmin);

  // Seed org A data across the tenant tables (service role bypasses RLS).
  const { data: form } = await admin
    .from("forms")
    .insert({ organisation_id: orgA, title: `Sec form ${RUN}` })
    .select("id")
    .single();
  formId = form!.id;
  await admin.from("form_submissions").insert({
    form_id: formId,
    organisation_id: orgA,
    data: { secret: "A" },
  });
  const { data: cand } = await admin
    .from("candidates")
    .insert({ organisation_id: orgA, full_name: `Sec cand ${RUN}` })
    .select("id")
    .single();
  candidateId = cand!.id;
  await admin.from("candidate_documents").insert({
    candidate_id: candidateId,
    organisation_id: orgA,
    doc_type: "dbs",
    file_path: "a/secret.pdf",
  });
  await admin.from("email_log").insert({
    organisation_id: orgA,
    to_email: "a@example.test",
    type: "digest",
    subject: "A digest",
  });
  await admin.from("audit_logs").insert({
    organisation_id: orgA,
    action: "test.secret",
  });

  adminB = await signIn(email("b"), PW);
}, 60_000);

afterAll(async () => {
  const admin = adminClient();
  await admin.from("forms").delete().eq("id", formId);
  await admin.from("candidates").delete().eq("id", candidateId);
  await admin.from("email_log").delete().eq("organisation_id", orgA);
  await admin.from("audit_logs").delete().eq("organisation_id", orgA);
  await cleanup(userIds, orgIds);
});

describe("cross-org isolation (foreign org_admin sees nothing)", () => {
  const tables = [
    "forms",
    "form_submissions",
    "candidates",
    "candidate_documents",
    "email_log",
    "audit_logs",
  ];

  for (const table of tables) {
    it(`${table}: no rows leak from another org`, async () => {
      const { data, error } = await adminB.from(table).select("*");
      expect(error).toBeNull();
      expect(data ?? []).toEqual([]);
    });
  }

  it("cannot write into another org's form", async () => {
    const { error } = await adminB.from("form_submissions").insert({
      form_id: formId,
      organisation_id: orgA,
      data: { intruder: true },
    });
    expect(error).not.toBeNull();
  });
});
