import { describe, it, expect } from "vitest";
import { computeBadges, computeStreak } from "../lib/gamification";

const base = {
  assigned: 3,
  completed: 1,
  certificates: 1,
  overdue: 0,
  inductionTotal: 12,
  inductionCompleted: 1,
};
const badge = (k: string, s: Parameters<typeof computeBadges>[0]) =>
  computeBadges(s).find((b) => b.key === k)!;

describe("computeBadges", () => {
  it("earns 'first pass' with a certificate", () => {
    expect(badge("first_pass", base).earned).toBe(true);
  });
  it("'high five' needs 5 completions", () => {
    expect(badge("five_done", { ...base, completed: 5 }).earned).toBe(true);
    expect(badge("five_done", { ...base, completed: 4 }).earned).toBe(false);
  });
  it("'compliant' needs all done and no overdue", () => {
    expect(
      badge("compliant", { ...base, completed: 3, overdue: 0 }).earned,
    ).toBe(true);
    expect(
      badge("compliant", { ...base, completed: 3, overdue: 1 }).earned,
    ).toBe(false);
  });
  it("'inducted' needs the whole pathway", () => {
    expect(
      badge("induction", { ...base, inductionCompleted: 12 }).earned,
    ).toBe(true);
    expect(
      badge("induction", { ...base, inductionCompleted: 11 }).earned,
    ).toBe(false);
  });
});

describe("computeStreak", () => {
  const now = new Date("2026-07-03T12:00:00Z");
  it("is 0 with no activity", () => {
    expect(computeStreak([], now)).toBe(0);
  });
  it("counts consecutive days ending today", () => {
    const d = ["2026-07-03", "2026-07-02", "2026-07-01"].map((s) => new Date(s));
    expect(computeStreak(d, now)).toBe(3);
  });
  it("counts from yesterday when nothing today", () => {
    const d = ["2026-07-02", "2026-07-01"].map((s) => new Date(s));
    expect(computeStreak(d, now)).toBe(2);
  });
  it("is 0 when the last activity is older than yesterday", () => {
    expect(computeStreak([new Date("2026-06-20")], now)).toBe(0);
  });
});
