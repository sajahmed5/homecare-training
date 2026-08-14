import { describe, it, expect } from "vitest";
import {
  isActiveLearner,
  isLateCompletion,
  type OrgLearnerRow,
} from "../lib/org-learners";

describe("isLateCompletion (overview 'completed late' count)", () => {
  it("is late when the certificate was issued after the due date", () => {
    expect(isLateCompletion("2026-08-10T09:00:00Z", "2026-08-01")).toBe(true);
  });

  it("is on time when issued on or before the due date", () => {
    expect(isLateCompletion("2026-08-01T23:59:00Z", "2026-08-01")).toBe(false);
    expect(isLateCompletion("2026-07-20T09:00:00Z", "2026-08-01")).toBe(false);
  });

  it("never late without a due date", () => {
    expect(isLateCompletion("2026-08-10T09:00:00Z", null)).toBe(false);
    expect(isLateCompletion("2026-08-10T09:00:00Z", undefined)).toBe(false);
  });
});

describe("isActiveLearner (headline stats exclude deactivated staff)", () => {
  const row = (status: string) => ({ status }) as OrgLearnerRow;

  it("active and unknown statuses count; deactivated do not", () => {
    expect(isActiveLearner(row("active"))).toBe(true);
    expect(isActiveLearner(row("deactivated"))).toBe(false);
  });
});
