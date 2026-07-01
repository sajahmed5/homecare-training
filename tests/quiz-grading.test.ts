import { describe, it, expect } from "vitest";
import {
  gradeQuiz,
  computeExpiry,
  makeCertificateNumber,
} from "../lib/quiz";

const key = new Map([
  ["a", 0],
  ["b", 1],
  ["c", 2],
  ["d", 0],
  ["e", 1],
]);
const ids = ["a", "b", "c", "d", "e"];

describe("gradeQuiz", () => {
  it("scores 100% when all correct", () => {
    const g = gradeQuiz(ids, key, { a: 0, b: 1, c: 2, d: 0, e: 1 });
    expect(g.score).toBe(100);
    expect(g.passed).toBe(true);
  });

  it("80% is a pass (boundary)", () => {
    const g = gradeQuiz(ids, key, { a: 0, b: 1, c: 2, d: 0, e: 9 });
    expect(g.correct).toBe(4);
    expect(g.score).toBe(80);
    expect(g.passed).toBe(true);
  });

  it("60% fails", () => {
    const g = gradeQuiz(ids, key, { a: 0, b: 1, c: 2, d: 9, e: 9 });
    expect(g.score).toBe(60);
    expect(g.passed).toBe(false);
  });

  it("unanswered questions count as wrong", () => {
    const g = gradeQuiz(["a", "b"], key, {});
    expect(g.correct).toBe(0);
    expect(g.passed).toBe(false);
  });
});

describe("computeExpiry", () => {
  it("adds the expiry months", () => {
    const from = new Date("2026-01-15T00:00:00Z");
    const e = computeExpiry(from, 12);
    expect(e).not.toBeNull();
    expect(e!.getTime()).toBeGreaterThan(from.getTime());
  });

  it("returns null for 0 (never expires)", () => {
    expect(computeExpiry(new Date(), 0)).toBeNull();
  });
});

describe("makeCertificateNumber", () => {
  it("formats as MCA-YEAR-XXXXXXXX", () => {
    expect(makeCertificateNumber("abcd1234-ef56-7890")).toMatch(
      /^MCA-\d{4}-[A-Z0-9]{8}$/,
    );
  });
});
