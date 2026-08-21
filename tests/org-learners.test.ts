import { describe, it, expect } from "vitest";
import {
  isActiveLearner,
  isInactive30d,
  isLateCompletion,
  isNeverActive,
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

describe("isInactive30d / isNeverActive (issue #22)", () => {
  const NOW = new Date("2026-08-21T12:00:00Z").getTime();
  const seen = (lastSeenAt: string | null) => ({ lastSeenAt }) as OrgLearnerRow;

  it("counts a stale sign-in as inactive, a recent one as not", () => {
    expect(isInactive30d(seen("2026-06-01T09:00:00Z"), NOW)).toBe(true);
    expect(isInactive30d(seen("2026-08-19T09:00:00Z"), NOW)).toBe(false);
  });

  it("never-signed-in is NOT inactive — it is its own state", () => {
    // The whole bug: the platform page folded these into "Inactive 30d+" while
    // the org page left them out, so one org read 223 and 0 for the same
    // people. Whatever the two mean, they must not both claim this row.
    expect(isInactive30d(seen(null), NOW)).toBe(false);
    expect(isNeverActive(seen(null))).toBe(true);
  });

  it("someone who has signed in is never 'never active'", () => {
    expect(isNeverActive(seen("2026-06-01T09:00:00Z"))).toBe(false);
  });

  it("the two states never overlap", () => {
    for (const r of [seen(null), seen("2026-06-01T09:00:00Z"), seen("2026-08-19T09:00:00Z")]) {
      expect(isInactive30d(r, NOW) && isNeverActive(r)).toBe(false);
    }
  });
});
