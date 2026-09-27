import { describe, it, expect } from "vitest";
import { endOfMonthISO, normaliseDate, parseAssignCsv, planPortalAssign } from "../lib/assign";

describe("endOfMonthISO (mandatory default due date)", () => {
  it("returns the last day of the current month", () => {
    expect(endOfMonthISO(new Date("2026-08-14T10:00:00Z"))).toBe("2026-08-31");
    expect(endOfMonthISO(new Date("2026-02-01T00:00:00Z"))).toBe("2026-02-28");
    expect(endOfMonthISO(new Date("2028-02-10T00:00:00Z"))).toBe("2028-02-29");
    expect(endOfMonthISO(new Date("2026-12-31T23:59:00Z"))).toBe("2026-12-31");
  });
});

describe("normaliseDate", () => {
  it("accepts ISO and UK formats", () => {
    expect(normaliseDate("2026-08-31")).toBe("2026-08-31");
    expect(normaliseDate("31/08/2026")).toBe("2026-08-31");
    expect(normaliseDate("1/9/2026")).toBe("2026-09-01");
  });

  it("rejects junk", () => {
    expect(normaliseDate("")).toBeNull();
    expect(normaliseDate("next week")).toBeNull();
    expect(normaliseDate("31-08-2026")).toBeNull();
  });
});

describe("parseAssignCsv (bulk course assignment)", () => {
  it("parses email,course,due date with a header", () => {
    const { rows } = parseAssignCsv(
      "email,course,due date\njo@example.com,Fire Safety,31/08/2026\njo@example.com,Whistleblowing,",
    );
    expect(rows).toEqual([
      { email: "jo@example.com", course: "Fire Safety", dueDate: "2026-08-31", problem: undefined },
      { email: "jo@example.com", course: "Whistleblowing", dueDate: null, problem: undefined },
    ]);
  });

  it("keeps quoted course titles with commas intact", () => {
    const { rows } = parseAssignCsv(
      'email,course\njo@example.com,"Health, Safety & Welfare"',
    );
    expect(rows[0].course).toBe("Health, Safety & Welfare");
  });

  it("flags rows with missing fields or bad dates", () => {
    const { rows } = parseAssignCsv(
      "email,course,due date\n,Fire Safety,\njo@example.com,,\njo@example.com,Fire Safety,someday",
    );
    expect(rows[0].problem).toMatch(/email/i);
    expect(rows[1].problem).toMatch(/course/i);
    expect(rows[2].problem).toMatch(/date/i);
  });

  it("flags every row when a file has no email column", () => {
    // "name,phone" doesn't match any known headers, so it parses as headerless
    // data — but nothing in it is an email, so every row is flagged.
    const { rows } = parseAssignCsv("name,phone\nJo,077");
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.problem)).toBe(true);
  });
});

describe("planPortalAssign (portal assignments always carry a due date)", () => {
  const base = { userIds: ["u1", "u2"], courseIds: ["c1"], defaultDue: "2026-09-30", nowIso: "2026-09-27T20:00:00Z" };

  it("a new enrolment with no date sent gets the end-of-month default", () => {
    const p = planPortalAssign({ ...base, existing: [], dueDateSent: null });
    expect(p.inserts).toEqual([
      { user_id: "u1", course_id: "c1", due_date: "2026-09-30", assigned_at: base.nowIso },
      { user_id: "u2", course_id: "c1", due_date: "2026-09-30", assigned_at: base.nowIso },
    ]);
    expect(p.dueUpdates).toEqual([]);
  });

  it("re-assigning without a date never wipes an existing due date, and fills a missing one", () => {
    const p = planPortalAssign({
      ...base, dueDateSent: null,
      existing: [
        { id: "e1", user_id: "u1", course_id: "c1", due_date: "2026-08-31" },
        { id: "e2", user_id: "u2", course_id: "c1", due_date: null },
      ],
    });
    expect(p.inserts).toEqual([]);
    expect(p.dueUpdates).toEqual([{ id: "e2", due_date: "2026-09-30" }]);
  });

  it("a date sent on purpose replaces the old one", () => {
    const p = planPortalAssign({
      ...base, userIds: ["u1"], dueDateSent: "2026-10-15",
      existing: [{ id: "e1", user_id: "u1", course_id: "c1", due_date: "2026-08-31" }],
    });
    expect(p.dueUpdates).toEqual([{ id: "e1", due_date: "2026-10-15" }]);
  });
});
