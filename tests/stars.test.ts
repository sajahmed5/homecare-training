import { describe, it, expect } from "vitest";
import {
  correctFromAttempt,
  starsForCourseCycles,
  computeStarTotal,
  currentCycleStartMs,
  bestStarsSince,
  STARS_PER_COURSE,
} from "../lib/stars";

// A 20-question attempt scoring `score`% has `score/5` correct answers.
const attempt = (course_id: string, score: number, submitted_at?: string, n = 20) => ({
  course_id,
  score,
  submitted_at,
  question_ids: Array.from({ length: n }, (_, i) => `q${i}`),
});

const ms = (iso: string) => Date.parse(iso);

describe("correctFromAttempt", () => {
  it("recovers correct-count from score% and question count", () => {
    expect(correctFromAttempt(attempt("a", 100))).toBe(20);
    expect(correctFromAttempt(attempt("a", 80))).toBe(16);
    expect(correctFromAttempt(attempt("a", 50))).toBe(10);
    expect(correctFromAttempt(attempt("a", 0))).toBe(0);
  });
  it("is 0 when there are no questions or no score", () => {
    expect(correctFromAttempt({ course_id: "a", score: 90, question_ids: [] })).toBe(0);
    expect(correctFromAttempt({ course_id: "a", score: null, question_ids: ["q"] })).toBe(0);
  });
});

describe("starsForCourseCycles — best per cycle, not additive within a cycle", () => {
  it("takes the BEST attempt in a cycle, not the sum (fail 10 then retake 18 → 18)", () => {
    const stars = starsForCourseCycles([attempt("a", 50), attempt("a", 90)], []);
    expect(stars).toBe(18); // not 10 + 18 = 28
  });
  it("caps at 20 per cycle", () => {
    expect(starsForCourseCycles([attempt("a", 100)], [])).toBe(STARS_PER_COURSE);
    expect(STARS_PER_COURSE).toBe(20);
  });
  it("no attempts → 0", () => {
    expect(starsForCourseCycles([], [])).toBe(0);
  });
  it("renewal after expiry banks a fresh pool (18 in cycle 1 + 20 in cycle 2 = 38)", () => {
    const attempts = [
      attempt("a", 90, "2025-01-01T00:00:00Z"), // cycle 1 — best 18
      attempt("a", 100, "2026-06-01T00:00:00Z"), // after expiry — cycle 2, best 20
    ];
    const expiry = [ms("2026-01-01T00:00:00Z")]; // cert from cycle 1 expired here
    expect(starsForCourseCycles(attempts, expiry)).toBe(18 + 20);
  });
  it("retaking while the certificate is still valid does NOT add a cycle", () => {
    const attempts = [
      attempt("a", 90, "2025-01-01T00:00:00Z"), // 18
      attempt("a", 100, "2025-06-01T00:00:00Z"), // still before expiry → same cycle, best 20
    ];
    const expiry = [ms("2026-01-01T00:00:00Z")]; // in the future relative to both attempts
    expect(starsForCourseCycles(attempts, expiry)).toBe(20); // one cycle, best 20
  });
});

describe("currentCycleStartMs / bestStarsSince — the submit-time delta", () => {
  const now = ms("2026-07-01T00:00:00Z");
  it("no past expiry → cycle start is -Infinity (first cycle)", () => {
    expect(currentCycleStartMs([ms("2027-01-01T00:00:00Z")], now)).toBe(-Infinity);
  });
  it("picks the most recent PAST expiry as the current cycle start", () => {
    const start = currentCycleStartMs(
      [ms("2025-01-01T00:00:00Z"), ms("2026-01-01T00:00:00Z"), ms("2027-01-01T00:00:00Z")],
      now,
    );
    expect(start).toBe(ms("2026-01-01T00:00:00Z"));
  });
  it("counts only attempts after the cycle start toward the current best", () => {
    const attempts = [
      attempt("a", 90, "2025-06-01T00:00:00Z"), // previous cycle — ignored
      attempt("a", 50, "2026-06-01T00:00:00Z"), // this cycle — 10
    ];
    const start = ms("2026-01-01T00:00:00Z");
    expect(bestStarsSince(attempts, start)).toBe(10);
  });
});

describe("computeStarTotal — sum of per-course, per-cycle bests", () => {
  it("sums the best of each course", () => {
    const total = computeStarTotal([
      attempt("a", 50),
      attempt("a", 90), // a best = 18
      attempt("b", 100), // b best = 20
    ]);
    expect(total).toBe(18 + 20);
  });
  it("adds renewal cycles across courses", () => {
    const total = computeStarTotal(
      [
        attempt("a", 90, "2025-01-01T00:00:00Z"), // 18
        attempt("a", 100, "2026-06-01T00:00:00Z"), // renewal → +20
        attempt("b", 100, "2025-03-01T00:00:00Z"), // 20 (never expires)
      ],
      [{ course_id: "a", expires_at: "2026-01-01T00:00:00Z" }],
    );
    expect(total).toBe(18 + 20 + 20);
  });
  it("empty → 0", () => {
    expect(computeStarTotal([])).toBe(0);
  });
});
