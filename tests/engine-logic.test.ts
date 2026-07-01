import { describe, it, expect } from "vitest";
import {
  renewalStage,
  isExpired,
  isOverdue,
  engagementRate,
  expiryFlag,
  daysSince,
} from "../lib/engine-logic";

const now = new Date("2026-07-01T00:00:00Z");
const inDays = (n: number) =>
  new Date(now.getTime() + n * 86_400_000);

describe("renewalStage", () => {
  const windows = [60, 30, 7];
  it("picks the 60-day window ~45 days out", () => {
    expect(renewalStage(inDays(45), now, windows)).toBe(60);
  });
  it("picks the 30-day window ~20 days out", () => {
    expect(renewalStage(inDays(20), now, windows)).toBe(30);
  });
  it("picks the 7-day window ~5 days out", () => {
    expect(renewalStage(inDays(5), now, windows)).toBe(7);
  });
  it("is null when comfortably in date", () => {
    expect(renewalStage(inDays(120), now, windows)).toBeNull();
  });
  it("is null once expired", () => {
    expect(renewalStage(inDays(-1), now, windows)).toBeNull();
  });
});

describe("isExpired", () => {
  it("true in the past", () => {
    expect(isExpired(inDays(-1), now)).toBe(true);
  });
  it("false in the future / null", () => {
    expect(isExpired(inDays(1), now)).toBe(false);
    expect(isExpired(null, now)).toBe(false);
  });
});

describe("expiryFlag", () => {
  it("red past or within 30 days", () => {
    expect(expiryFlag(inDays(-2), now)).toBe("red");
    expect(expiryFlag(inDays(20), now)).toBe("red");
  });
  it("amber within 60 days", () => {
    expect(expiryFlag(inDays(45), now)).toBe("amber");
  });
  it("green well in date", () => {
    expect(expiryFlag(inDays(200), now)).toBe("green");
  });
});

describe("isOverdue", () => {
  it("overdue when past due and not completed", () => {
    expect(isOverdue("2026-06-01", "in_progress", now)).toBe(true);
  });
  it("not overdue when completed", () => {
    expect(isOverdue("2026-06-01", "completed", now)).toBe(false);
  });
  it("not overdue with no due date", () => {
    expect(isOverdue(null, "not_started", now)).toBe(false);
  });
});

describe("engagementRate", () => {
  it("computes a percentage", () => {
    expect(engagementRate(4, 2)).toBe(50);
  });
  it("treats no assignments as fully engaged", () => {
    expect(engagementRate(0, 0)).toBe(100);
  });
});

describe("daysSince", () => {
  it("Infinity when never", () => {
    expect(daysSince(null, now)).toBe(Infinity);
  });
  it("counts whole days", () => {
    expect(daysSince(inDays(-10), now)).toBe(10);
  });
});
