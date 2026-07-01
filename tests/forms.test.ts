import { describe, it, expect } from "vitest";
import { isFieldVisible, fieldHasOptions } from "../lib/forms";

describe("isFieldVisible", () => {
  const cond = { conditional: { whenFieldId: "q1", equals: "Yes" } };

  it("always shows when there is no condition", () => {
    expect(isFieldVisible({ conditional: null }, {})).toBe(true);
  });

  it("shows when the controlling field matches", () => {
    expect(isFieldVisible(cond, { q1: "Yes" })).toBe(true);
  });

  it("hides when it doesn't match", () => {
    expect(isFieldVisible(cond, { q1: "No" })).toBe(false);
    expect(isFieldVisible(cond, {})).toBe(false);
  });

  it("matches against checkbox (array) values", () => {
    expect(isFieldVisible(cond, { q1: ["No", "Yes"] })).toBe(true);
    expect(isFieldVisible(cond, { q1: ["No"] })).toBe(false);
  });
});

describe("fieldHasOptions", () => {
  it("true for choice fields", () => {
    expect(fieldHasOptions("select")).toBe(true);
    expect(fieldHasOptions("radio")).toBe(true);
    expect(fieldHasOptions("checkbox")).toBe(true);
  });
  it("false otherwise", () => {
    expect(fieldHasOptions("text")).toBe(false);
    expect(fieldHasOptions("signature")).toBe(false);
  });
});
