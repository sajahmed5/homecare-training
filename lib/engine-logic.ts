// Pure decision logic for the proactive engine — no I/O, unit-testable.

export function daysUntil(date: Date, now: Date): number {
  return Math.ceil((date.getTime() - now.getTime()) / 86_400_000);
}

export function isExpired(expiresAt: Date | null, now: Date): boolean {
  return !!expiresAt && expiresAt.getTime() < now.getTime();
}

/**
 * The renewal window (in days) a certificate currently falls into, or null if
 * it isn't within any window yet (or is already expired). e.g. windows
 * [60,30,7]: 45 days out → 60, 20 days out → 30, 5 days out → 7.
 */
export function renewalStage(
  expiresAt: Date,
  now: Date,
  windows: number[],
): number | null {
  const days = daysUntil(expiresAt, now);
  if (days < 0) return null;
  const sorted = [...windows].sort((a, b) => a - b);
  for (const w of sorted) if (days <= w) return w;
  return null;
}

/** amber/red flag for a certificate approaching or past expiry. */
export function expiryFlag(
  expiresAt: Date | null,
  now: Date,
): "red" | "amber" | "green" | "none" {
  if (!expiresAt) return "none";
  const days = daysUntil(expiresAt, now);
  if (days < 0) return "red";
  if (days <= 30) return "red";
  if (days <= 60) return "amber";
  return "green";
}

export function isOverdue(
  dueDate: string | null,
  status: string,
  now: Date,
): boolean {
  return (
    !!dueDate &&
    status !== "completed" &&
    new Date(dueDate).getTime() < now.getTime()
  );
}

/** Completion rate as a percentage. No assignments = 100 (not "low engagement"). */
export function engagementRate(total: number, completed: number): number {
  if (total <= 0) return 100;
  return Math.round((completed / total) * 100);
}

export function daysSince(date: Date | null, now: Date): number {
  if (!date) return Infinity;
  return Math.floor((now.getTime() - date.getTime()) / 86_400_000);
}
