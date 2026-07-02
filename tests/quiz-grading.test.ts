import { describe, it, expect } from "vitest";
import {
  gradeQuiz,
  gradeAnswer,
  toPublicQuestion,
  computeExpiry,
  makeCertificateNumber,
  type StoredQuestion,
} from "../lib/quiz";

const mcq = (id: string, answer_index: number): StoredQuestion => ({
  id,
  type: "mcq",
  question: "q",
  options: ["a", "b", "c", "d"],
  answer_index,
  payload: null,
});

describe("gradeQuiz (mcq)", () => {
  const qs = [mcq("a", 0), mcq("b", 1), mcq("c", 2), mcq("d", 0), mcq("e", 1)];

  it("scores 100% when all correct", () => {
    const g = gradeQuiz(qs, { a: 0, b: 1, c: 2, d: 0, e: 1 });
    expect(g.score).toBe(100);
    expect(g.passed).toBe(true);
  });

  it("80% is a pass (boundary)", () => {
    const g = gradeQuiz(qs, { a: 0, b: 1, c: 2, d: 0, e: 9 });
    expect(g.correct).toBe(4);
    expect(g.score).toBe(80);
    expect(g.passed).toBe(true);
  });

  it("60% fails", () => {
    const g = gradeQuiz(qs, { a: 0, b: 1, c: 2, d: 9, e: 9 });
    expect(g.score).toBe(60);
    expect(g.passed).toBe(false);
  });

  it("unanswered questions count as wrong", () => {
    const g = gradeQuiz([mcq("a", 0), mcq("b", 1)], {});
    expect(g.correct).toBe(0);
    expect(g.passed).toBe(false);
  });
});

describe("gradeAnswer (types)", () => {
  it("multi requires the exact set", () => {
    const q: StoredQuestion = { id: "m", type: "multi", question: "q", options: ["a", "b", "c", "d"], answer_index: null, payload: { correctIndices: [0, 2] } };
    expect(gradeAnswer(q, [0, 2])).toBe(true);
    expect(gradeAnswer(q, [2, 0])).toBe(true); // order-independent
    expect(gradeAnswer(q, [0])).toBe(false); // missing one
    expect(gradeAnswer(q, [0, 2, 3])).toBe(false); // extra wrong pick
  });

  it("true_false checks the index", () => {
    const q: StoredQuestion = { id: "t", type: "true_false", question: "q", options: ["True", "False"], answer_index: 1, payload: null };
    expect(gradeAnswer(q, 1)).toBe(true);
    expect(gradeAnswer(q, 0)).toBe(false);
  });

  it("fill_blank is case-insensitive and accepts alternatives", () => {
    const q: StoredQuestion = { id: "f", type: "fill_blank", question: "The fridge should be ___ or below.", options: null, answer_index: null, payload: { blanks: [{ answers: ["5", "five"] }] } };
    expect(gradeAnswer(q, ["5"])).toBe(true);
    expect(gradeAnswer(q, ["Five"])).toBe(true);
    expect(gradeAnswer(q, ["8"])).toBe(false);
    expect(gradeAnswer(q, [])).toBe(false); // wrong number of blanks
  });

  it("hotspot requires all correct zones and no wrong ones", () => {
    const q: StoredQuestion = { id: "h", type: "hotspot", question: "Click the hazards", options: null, answer_index: null, payload: { image: "/x.svg", zones: [ { id: 1, x: 0, y: 0, w: 10, h: 10, correct: true }, { id: 2, x: 0, y: 0, w: 10, h: 10, correct: true }, { id: 3, x: 0, y: 0, w: 10, h: 10 } ] } };
    expect(gradeAnswer(q, [1, 2])).toBe(true);
    expect(gradeAnswer(q, [1])).toBe(false); // missed a hazard
    expect(gradeAnswer(q, [1, 2, 3])).toBe(false); // clicked a safe spot
  });
});

describe("toPublicQuestion", () => {
  it("strips the correct flag from hotspot zones", () => {
    const q: StoredQuestion = { id: "h", type: "hotspot", question: "Click", options: null, answer_index: null, payload: { image: "/x.svg", zones: [{ id: 1, x: 0, y: 0, w: 5, h: 5, correct: true }] } };
    const pub = toPublicQuestion(q);
    expect(pub.type).toBe("hotspot");
    if (pub.type === "hotspot") {
      expect(pub.zones[0]).not.toHaveProperty("correct");
    }
  });

  it("never leaks answer_index for mcq", () => {
    const pub = toPublicQuestion(mcq("a", 2));
    expect(JSON.stringify(pub)).not.toContain("answer_index");
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
