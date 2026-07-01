import { daysUntil } from "@/lib/engine-logic";

export type NotifType = "assigned" | "certificate" | "expiring" | "required";

export interface Notif {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  /** Event time — used for ordering and unread comparison. */
  at: string; // ISO
  href: string;
}

export interface EnrolmentInput {
  course_id: string;
  status: string;
  assigned_at: string;
  title: string;
}
export interface CertInput {
  id: string;
  course_id: string;
  issued_at: string;
  expires_at: string | null;
  title: string;
}

const EXPIRY_WINDOW_DAYS = 60;

/** Derive a learner's notifications from their enrolments and certificates. Pure. */
export function deriveNotifications(
  enrolments: EnrolmentInput[],
  certificates: CertInput[],
  now: Date,
): Notif[] {
  const items: Notif[] = [];

  // Latest certificate per course (newest issued).
  const latestCert = new Map<string, CertInput>();
  for (const c of [...certificates].sort(
    (a, b) => +new Date(b.issued_at) - +new Date(a.issued_at),
  )) {
    if (!latestCert.has(c.course_id)) latestCert.set(c.course_id, c);
  }

  for (const e of enrolments) {
    if (e.status === "not_started") {
      items.push({
        id: `assigned-${e.course_id}`,
        type: "assigned",
        title: "New training assigned",
        body: e.title,
        at: e.assigned_at,
        href: "/learn/modules",
      });
    }
    if (e.status === "expired") {
      const cert = latestCert.get(e.course_id);
      items.push({
        id: `required-${e.course_id}`,
        type: "required",
        title: "Retake required",
        body: `${e.title} has expired and needs retaking`,
        at: cert?.expires_at ?? e.assigned_at,
        href: "/learn/modules",
      });
    }
  }

  for (const c of certificates) {
    items.push({
      id: `cert-${c.id}`,
      type: "certificate",
      title: "Certificate ready",
      body: c.title,
      at: c.issued_at,
      href: "/learn/certificates",
    });
  }

  for (const c of latestCert.values()) {
    if (!c.expires_at) continue;
    const days = daysUntil(new Date(c.expires_at), now);
    if (days > 0 && days <= EXPIRY_WINDOW_DAYS) {
      const entered = new Date(
        new Date(c.expires_at).getTime() - EXPIRY_WINDOW_DAYS * 86_400_000,
      );
      items.push({
        id: `expiring-${c.id}`,
        type: "expiring",
        title: "Certificate expiring soon",
        body: `${c.title} expires in ${days} day${days === 1 ? "" : "s"}`,
        at: entered.toISOString(),
        href: "/learn/certificates",
      });
    }
  }

  return items.sort((a, b) => +new Date(b.at) - +new Date(a.at)).slice(0, 40);
}

export function unreadCount(notifs: Notif[], readAt: string | null): number {
  if (!readAt) return notifs.length;
  const r = +new Date(readAt);
  return notifs.filter((n) => +new Date(n.at) > r).length;
}
