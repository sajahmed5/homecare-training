import { describe, it, expect } from "vitest";
import { cellText } from "../lib/matrix";

const cert = { issued_at: "2026-03-04T09:00:00Z", expires_at: "2027-03-04T09:00:00Z" };

describe("training matrix cells say which kind of blank they are", () => {
  it("shows the completion and expiry dates when there is a certificate", () => {
    expect(cellText(cert, "completed")).toBe("04/03/2026 → 04/03/2027");
  });

  it("says so when a course never expires", () => {
    expect(cellText({ ...cert, expires_at: null }, "completed")).toBe(
      "04/03/2026 → no expiry",
    );
  });

  it("tells a never-assigned course apart from an unfinished one", () => {
    // Both of these used to be an empty cell, so "not trained" and "nothing
    // to do here" looked identical to an inspector.
    expect(cellText(undefined, undefined)).toBe("Not assigned");
    expect(cellText(undefined, "not_started")).toBe("Assigned, not started");
    expect(cellText(undefined, "in_progress")).toBe("In progress");
  });

  it("flags training that lapsed", () => {
    expect(cellText(undefined, "expired")).toBe("Expired — needs retaking");
  });

  it("never returns an empty cell", () => {
    for (const status of [undefined, "not_started", "in_progress", "expired", "completed"]) {
      expect(cellText(undefined, status).length).toBeGreaterThan(0);
    }
  });
});
