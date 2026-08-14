import { describe, it, expect } from "vitest";
import { endOfMonthISO, normaliseDate, parseAssignCsv } from "../lib/assign";

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
