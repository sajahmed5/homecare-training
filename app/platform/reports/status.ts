export const REPORT_STATUSES = ["open", "reviewing", "resolved"] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  reviewing: "Reviewing",
  resolved: "Resolved",
};

const STATUS_CLASSES: Record<string, string> = {
  open: "bg-amber-100 text-amber-800",
  reviewing: "bg-blue-100 text-blue-800",
  resolved: "bg-green-100 text-green-800",
};

export function statusPillClass(status: string): string {
  return `inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
    STATUS_CLASSES[status] ?? "bg-muted text-muted-foreground"
  }`;
}
