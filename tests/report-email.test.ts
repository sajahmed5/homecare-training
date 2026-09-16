import { describe, it, expect } from "vitest";
import { reportChanged, reportUpdateEmail, type ReportChange } from "../lib/report-email";

const base: ReportChange = {
  reportNo: 40,
  summary: "Change order",
  prevStatus: "open",
  status: "open",
  prevNote: null,
  note: null,
};

describe("report update email (issue #41)", () => {
  it("only counts a real change — resaving the same thing sends nothing", () => {
    expect(reportChanged(base)).toBe(false);
    expect(reportChanged({ ...base, prevNote: "Hi ", note: "Hi" })).toBe(false);
    expect(reportChanged({ ...base, status: "resolved" })).toBe(true);
    expect(reportChanged({ ...base, note: "Looking into it" })).toBe(true);
  });

  it("names the new status in the subject when it changed", () => {
    const { subject, html } = reportUpdateEmail(
      "Norwood",
      { ...base, status: "resolved", note: "Fixed in v2.5.8" },
      "https://x",
    );
    expect(subject).toBe('Your report #40 "Change order" is now resolved');
    expect(html).toContain("Fixed in v2.5.8");
    expect(html).toContain("(was Open)");
    expect(html).toContain("https://x/report");
  });

  it("says 'update' when only the note changed", () => {
    const { subject } = reportUpdateEmail(null, { ...base, note: "On it" }, "https://x");
    expect(subject).toBe('Update on your report #40 "Change order"');
  });

  it("escapes the summary and note — both are typed by people", () => {
    const { html } = reportUpdateEmail(
      "<b>",
      { ...base, summary: "<script>", note: "a & b" },
      "https://x",
    );
    expect(html).not.toContain("<script>");
    expect(html).toContain("a &amp; b");
  });
});
