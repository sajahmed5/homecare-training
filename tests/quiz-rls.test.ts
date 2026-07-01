import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { adminClient, cleanup, createOrg, createUser, signIn } from "./helpers";

const RUN = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
const PW = "Test-Passw0rd!";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const email = (l: string) => `q-${l}-${RUN}@example.test`;

let orgA: string;
let orgB: string;
let courseId: string;
let learnerAId: string;
let certNumber: string;

const userIds: string[] = [];
const orgIds: string[] = [];

let learnerA: SupabaseClient;
let learnerB: SupabaseClient;
let platform: SupabaseClient;

beforeAll(async () => {
  const admin = adminClient();
  orgA = await createOrg(`Q Org A ${RUN}`);
  orgB = await createOrg(`Q Org B ${RUN}`);
  orgIds.push(orgA, orgB);

  learnerAId = await createUser({
    email: email("learner-a"),
    password: PW,
    role: "learner",
    organisationId: orgA,
  });
  const learnerBId = await createUser({
    email: email("learner-b"),
    password: PW,
    role: "learner",
    organisationId: orgB,
  });
  const platformId = await createUser({
    email: email("platform"),
    password: PW,
    role: "platform_admin",
    organisationId: null,
  });
  userIds.push(learnerAId, learnerBId, platformId);

  const { data: course } = await admin
    .from("courses")
    .insert({
      title: `Q Course ${RUN}`,
      slug: `q-course-${RUN}`,
      content_blocks: [],
    })
    .select("id")
    .single();
  courseId = course!.id;

  await admin.from("quiz_questions").insert({
    course_id: courseId,
    question: "Secret?",
    options: ["a", "b"],
    answer_index: 1,
  });

  certNumber = `MCA-TEST-${RUN}`;
  await admin.from("certificates").insert({
    certificate_number: certNumber,
    organisation_id: orgA,
    user_id: learnerAId,
    course_id: courseId,
    expires_at: new Date(Date.now() + 3.15e10).toISOString(),
  });

  learnerA = await signIn(email("learner-a"), PW);
  learnerB = await signIn(email("learner-b"), PW);
  platform = await signIn(email("platform"), PW);
}, 60_000);

afterAll(async () => {
  const admin = adminClient();
  await admin.from("courses").delete().eq("id", courseId);
  await cleanup(userIds, orgIds);
});

describe("quiz_questions are not exposed to learners", () => {
  it("a learner cannot read the question bank (RLS blocks answers)", async () => {
    const { data } = await learnerA
      .from("quiz_questions")
      .select("id, answer_index")
      .eq("course_id", courseId);
    expect(data ?? []).toEqual([]);
  });

  it("a platform_admin can read the question bank", async () => {
    const { data } = await platform
      .from("quiz_questions")
      .select("id")
      .eq("course_id", courseId);
    expect(data?.length).toBe(1);
  });
});

describe("public certificate verification", () => {
  it("returns non-PII for a valid number", async () => {
    const anon = createClient(SUPABASE_URL, ANON_KEY, {
      auth: { persistSession: false },
    });
    const { data } = await anon.rpc("verify_certificate", {
      cert_number: certNumber,
    });
    expect(data?.length).toBe(1);
    expect(data![0].course_title).toContain("Q Course");
    // No learner name / email in the response shape.
    expect(Object.keys(data![0])).not.toContain("user_id");
  });

  it("returns nothing for an unknown number", async () => {
    const anon = createClient(SUPABASE_URL, ANON_KEY, {
      auth: { persistSession: false },
    });
    const { data } = await anon.rpc("verify_certificate", {
      cert_number: "MCA-DOES-NOT-EXIST",
    });
    expect(data ?? []).toEqual([]);
  });
});

describe("certificate visibility", () => {
  it("a learner sees their own certificate", async () => {
    const { data } = await learnerA
      .from("certificates")
      .select("certificate_number")
      .eq("course_id", courseId);
    expect(data?.length).toBe(1);
  });

  it("a learner in another org cannot see it", async () => {
    const { data } = await learnerB
      .from("certificates")
      .select("id")
      .eq("course_id", courseId);
    expect(data ?? []).toEqual([]);
  });
});
