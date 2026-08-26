import { describe, it, expect } from "vitest";
import { certificateState, needsAttention, type OrgCertificateRow } from "../lib/certificates";

const NOW = new Date("2026-08-25T12:00:00Z");
/** An expiry date `days` from NOW, as the ISO string the column holds. */
const inDays = (days: number) =>
  new Date(NOW.getTime() + days * 86_400_000).toISOString();

describe("certificateState (renewal bands)", () => {
  it("separates already-expired from expiring soon", () => {
    // expiryFlag calls both of these "red"; a work list has to tell them apart.
    expect(certificateState(inDays(-1), NOW).state).toBe("expired");
    expect(certificateState(inDays(5), NOW).state).toBe("due_30");
  });

  it("puts the band edges on the right side", () => {
    expect(certificateState(inDays(30), NOW).state).toBe("due_30");
    expect(certificateState(inDays(31), NOW).state).toBe("due_60");
    expect(certificateState(inDays(60), NOW).state).toBe("due_60");
    expect(certificateState(inDays(61), NOW).state).toBe("valid");
  });

  it("a certificate with no expiry never needs renewing", () => {
    const { state, daysLeft } = certificateState(null, NOW);
    expect(state).toBe("no_expiry");
    expect(daysLeft).toBeNull();
  });

  it("reports how long is left, negative once lapsed", () => {
    expect(certificateState(inDays(9), NOW).daysLeft).toBe(9);
    expect(certificateState(inDays(-12), NOW).daysLeft).toBeLessThan(0);
  });
});

describe("needsAttention (the default view)", () => {
  const row = (state: OrgCertificateRow["state"]) => ({ state }) as OrgCertificateRow;

  it("covers expired and both expiring bands, and nothing else", () => {
    expect(needsAttention(row("expired"))).toBe(true);
    expect(needsAttention(row("due_30"))).toBe(true);
    expect(needsAttention(row("due_60"))).toBe(true);
    expect(needsAttention(row("valid"))).toBe(false);
    expect(needsAttention(row("no_expiry"))).toBe(false);
  });
});
