import { describe, it, expect } from "vitest";
import { describe as describeRow } from "../lib/activity";

const row = (over: Partial<Parameters<typeof describeRow>[0]> = {}) => ({
  id: "1",
  action: "staff.deactivated",
  entity: "user",
  entity_id: "u1",
  actor_id: "a1",
  actor_email: "manager@example.test",
  detail: null,
  created_at: "2026-10-07T15:00:00Z",
  ...over,
});

describe("activity, in words a manager would use", () => {
  it("names the person an action was about", () => {
    expect(describeRow(row(), "Amina Hassan")).toBe("Deactivated Amina Hassan");
    expect(describeRow(row({ action: "staff.reactivated" }), "Amina Hassan")).toBe(
      "Reactivated Amina Hassan",
    );
  });

  it("falls back to something true when the person is gone", () => {
    expect(describeRow(row(), null)).toBe("Deactivated a member of staff");
  });

  it("counts an assignment in carers and courses", () => {
    expect(
      describeRow(
        row({
          action: "training.assigned",
          entity: "enrolment",
          detail: { courses: 3, learners: 20, dueDate: "2026-10-31" },
        }),
        null,
      ),
    ).toBe("Assigned 3 courses to 20 carers, due 2026-10-31");
  });

  it("uses the singular where it should", () => {
    expect(
      describeRow(
        row({ action: "training.assigned", detail: { courses: 1, learners: 1 } }),
        null,
      ),
    ).toBe("Assigned 1 course to 1 carer");
  });

  it("says who was invited, and flags an admin invite", () => {
    expect(
      describeRow(row({ action: "user.invited", detail: { email: "jo@x.test", role: "org_admin" } }), null),
    ).toBe("Invited jo@x.test as an admin");
  });

  it("never shows a raw action key for something it doesn't know", () => {
    const text = describeRow(row({ action: "something.new", detail: null }), null);
    expect(text).toBe("Made a change");
    expect(text).not.toContain(".");
  });
});
