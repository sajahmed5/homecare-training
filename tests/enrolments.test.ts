import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { adminClient, cleanup, createOrg, createUser, signIn } from "./helpers";

const RUN = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
const PW = "Test-Passw0rd!";
const email = (l: string) => `enr-${l}-${RUN}@example.test`;

let orgA: string;
let orgB: string;
let courseId: string;
let learnerAId: string;

const userIds: string[] = [];
const orgIds: string[] = [];

let adminA: SupabaseClient;
let learnerA: SupabaseClient;
let learnerB: SupabaseClient;

beforeAll(async () => {
  const admin = adminClient();
  orgA = await createOrg(`Enr Org A ${RUN}`);
  orgB = await createOrg(`Enr Org B ${RUN}`);
  orgIds.push(orgA, orgB);

  const adminAId = await createUser({
    email: email("admin-a"),
    password: PW,
    role: "org_admin",
    organisationId: orgA,
  });
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
  userIds.push(adminAId, learnerAId, learnerBId);

  // A throwaway course (service role bypasses the platform_admin write policy).
  const { data: course } = await admin
    .from("courses")
    .insert({
      title: `Test Course ${RUN}`,
      slug: `test-course-${RUN}`,
      content_blocks: [],
    })
    .select("id")
    .single();
  courseId = course!.id;

  adminA = await signIn(email("admin-a"), PW);
  learnerA = await signIn(email("learner-a"), PW);
  learnerB = await signIn(email("learner-b"), PW);
}, 60_000);

afterAll(async () => {
  await adminClient().from("courses").delete().eq("id", courseId);
  await cleanup(userIds, orgIds);
});

describe("catalogue is shared", () => {
  it("any authenticated learner can read courses", async () => {
    const { data, error } = await learnerA
      .from("courses")
      .select("id")
      .eq("id", courseId);
    expect(error).toBeNull();
    expect(data?.length).toBe(1);
  });
});

describe("enrolment RLS", () => {
  it("org_admin can assign a course to a learner in their org", async () => {
    const { error } = await adminA.from("enrolments").insert({
      organisation_id: orgA,
      user_id: learnerAId,
      course_id: courseId,
    });
    expect(error).toBeNull();
  });

  it("org_admin cannot assign into another organisation", async () => {
    const { error } = await adminA.from("enrolments").insert({
      organisation_id: orgB, // not the caller's org
      user_id: learnerAId,
      course_id: courseId,
    });
    expect(error).not.toBeNull();
  });

  it("the learner sees their own enrolment", async () => {
    const { data } = await learnerA
      .from("enrolments")
      .select("id, progress, status");
    expect(data?.length).toBe(1);
    expect(data?.[0].status).toBe("not_started");
  });

  it("a learner in another org cannot see it", async () => {
    const { data } = await learnerB.from("enrolments").select("id");
    expect(data ?? []).toEqual([]);
  });

  it("the learner can update their own progress", async () => {
    const { error } = await learnerA
      .from("enrolments")
      .update({ progress: 50, status: "in_progress" })
      .eq("user_id", learnerAId)
      .eq("course_id", courseId);
    expect(error).toBeNull();

    const { data } = await learnerA
      .from("enrolments")
      .select("progress")
      .single();
    expect(data?.progress).toBe(50);
  });

  it("a learner cannot update someone else's enrolment", async () => {
    const { data } = await learnerB
      .from("enrolments")
      .update({ progress: 100 })
      .eq("user_id", learnerAId)
      .eq("course_id", courseId)
      .select("id");
    expect(data ?? []).toEqual([]);
  });
});
