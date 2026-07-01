import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { adminClient, cleanup, createOrg, createUser, signIn } from "./helpers";

// Self-enrolment goes through a guarded service-role action — there is
// deliberately NO learner-insert RLS policy, so a learner cannot insert an
// enrolment directly (which would let them fabricate a completed status).

const RUN = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
const PW = "Test-Passw0rd!";

let orgId: string;
let courseId: string;
const userIds: string[] = [];
const orgIds: string[] = [];
let learner: SupabaseClient;

beforeAll(async () => {
  const admin = adminClient();
  orgId = await createOrg(`SelfEnrol ${RUN}`);
  orgIds.push(orgId);
  const id = await createUser({
    email: `se-${RUN}@example.test`,
    password: PW,
    role: "learner",
    organisationId: orgId,
  });
  userIds.push(id);
  const { data: course } = await admin
    .from("courses")
    .insert({ title: `SE ${RUN}`, slug: `se-${RUN}`, content_blocks: [] })
    .select("id")
    .single();
  courseId = course!.id;
  learner = await signIn(`se-${RUN}@example.test`, PW);
}, 60_000);

afterAll(async () => {
  await adminClient().from("courses").delete().eq("id", courseId);
  await cleanup(userIds, orgIds);
});

describe("learner self-insert is blocked by RLS", () => {
  it("a learner cannot directly insert an enrolment", async () => {
    const { error } = await learner.from("enrolments").insert({
      organisation_id: orgId,
      user_id: (await learner.auth.getUser()).data.user!.id,
      course_id: courseId,
      status: "completed", // the exact thing we must prevent
    });
    expect(error).not.toBeNull();
  });
});
