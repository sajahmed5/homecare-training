import { describe, it, expect } from "vitest";
import {
  deriveNotifications,
  unreadCount,
  type Notif,
} from "../lib/notifications";

const now = new Date("2026-07-01T00:00:00Z");

describe("deriveNotifications", () => {
  it("creates an 'assigned' item for a not_started enrolment", () => {
    const n = deriveNotifications(
      [{ course_id: "c1", status: "not_started", assigned_at: "2026-06-30T00:00:00Z", title: "A" }],
      [],
      now,
    );
    expect(n.some((x) => x.type === "assigned")).toBe(true);
  });

  it("creates 'certificate' and 'expiring' for a soon-to-expire cert", () => {
    const expires = new Date(now.getTime() + 20 * 86_400_000).toISOString();
    const n = deriveNotifications(
      [],
      [{ id: "x", course_id: "c1", issued_at: "2026-06-01T00:00:00Z", expires_at: expires, title: "A" }],
      now,
    );
    expect(n.some((x) => x.type === "certificate")).toBe(true);
    expect(n.some((x) => x.type === "expiring")).toBe(true);
  });

  it("does not flag expiring when comfortably in date", () => {
    const expires = new Date(now.getTime() + 300 * 86_400_000).toISOString();
    const n = deriveNotifications(
      [],
      [{ id: "x", course_id: "c1", issued_at: "2026-06-01T00:00:00Z", expires_at: expires, title: "A" }],
      now,
    );
    expect(n.some((x) => x.type === "expiring")).toBe(false);
  });

  it("creates 'required' for an expired enrolment", () => {
    const n = deriveNotifications(
      [{ course_id: "c1", status: "expired", assigned_at: "2026-01-01T00:00:00Z", title: "A" }],
      [],
      now,
    );
    expect(n.some((x) => x.type === "required")).toBe(true);
  });
});

describe("unreadCount", () => {
  const items: Notif[] = [
    { id: "1", type: "assigned", title: "", body: "", at: "2026-07-02T00:00:00Z", href: "" },
    { id: "2", type: "assigned", title: "", body: "", at: "2026-06-01T00:00:00Z", href: "" },
  ];
  it("counts items after last-read", () => {
    expect(unreadCount(items, "2026-06-15T00:00:00Z")).toBe(1);
  });
  it("all unread when never read", () => {
    expect(unreadCount(items, null)).toBe(2);
  });
});
