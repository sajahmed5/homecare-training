"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { bucketOf, type OrgLearnerRow } from "@/lib/org-learners";

const DAY = 86_400_000;

function fmtDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function lastActive(d: string | null): { label: string; stale: boolean } {
  if (!d) return { label: "Never", stale: true };
  const days = Math.floor((Date.now() - new Date(d).getTime()) / DAY);
  const stale = days > 30;
  if (days <= 0) return { label: "Today", stale };
  if (days === 1) return { label: "Yesterday", stale };
  if (days < 30) return { label: `${days} days ago`, stale };
  return { label: fmtDate(d), stale };
}

export type Filter =
  | "all"
  | "overdue"
  | "in_progress"
  | "not_started"
  | "completed"
  | "unassigned"
  | "deactivated"
  | "inactive"
  | "never";

const STATUS_FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "overdue", label: "Overdue" },
  { key: "in_progress", label: "In progress" },
  { key: "not_started", label: "Not started" },
  { key: "completed", label: "Completed" },
  { key: "unassigned", label: "Nothing assigned" },
];

// Activity and account status are separate lenses, not part of the status
// breakdown. Inactive 30d+ means "has logged in, but not for 30+ days" —
// never-active users have their own pill (issue #15).
const ACTIVITY_FILTERS: { key: Filter; label: string }[] = [
  { key: "inactive", label: "Inactive 30d+" },
  { key: "never", label: "Never active" },
  { key: "deactivated", label: "Deactivated" },
];

function matches(r: OrgLearnerRow, f: Filter): boolean {
  // Deactivated accounts (leavers — the rostering portal archived them) are
  // kept for their training history, but they belong under All/Deactivated
  // only: surfacing a leaver as "overdue" or "never active" invites someone
  // to chase a person who can no longer log in.
  if (r.status === "deactivated") return f === "all" || f === "deactivated";
  switch (f) {
    case "deactivated":
      return false; // handled by the short-circuit above
    case "inactive":
      return (
        !!r.lastSeenAt && Date.now() - new Date(r.lastSeenAt).getTime() > 30 * DAY
      );
    case "never":
      return !r.lastSeenAt;
    case "all":
      return true;
    default:
      return bucketOf(r) === f;
  }
}

const csvCell = (v: string) =>
  /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;

export function LearnersTable({
  rows,
  filename = "learners-overview.csv",
  initialFilter = "all",
}: {
  rows: OrgLearnerRow[];
  filename?: string;
  /** Pre-selected filter pill (deep links like ?filter=overdue). */
  initialFilter?: Filter;
}) {
  const [filter, setFilter] = useState<Filter>(initialFilter);
  const shown = useMemo(() => rows.filter((r) => matches(r, filter)), [rows, filter]);

  function exportCsv() {
    const header = [
      "Learner",
      "Status",
      "Email",
      "Assigned",
      "Completed",
      "In progress",
      "Not started",
      "Overdue",
      "Overall %",
      "Latest completed",
      "Completed on",
      "Last assigned",
      "Last active",
    ];
    const body = shown.map((r) =>
      [
        r.name,
        r.status === "deactivated" ? "Deactivated" : "Active",
        r.email ?? "",
        String(r.stats.assigned),
        String(r.stats.completed),
        String(r.stats.inProgress),
        String(r.stats.notStarted),
        String(r.stats.overdue),
        `${r.stats.overallPct}%`,
        r.latestCompleted?.title ?? "",
        r.latestCompleted ? fmtDate(r.latestCompleted.date) : "",
        fmtDate(r.lastAssignedAt),
        r.lastSeenAt ? fmtDate(r.lastSeenAt) : "Never",
      ]
        .map(csvCell)
        .join(","),
    );
    const csv = "﻿" + [header.map(csvCell).join(","), ...body].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {STATUS_FILTERS.map((f) => {
            const count = rows.filter((r) => matches(r, f.key)).length;
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                  active
                    ? "border-foreground bg-foreground text-background"
                    : "hover:bg-accent"
                }`}
              >
                {f.label}{" "}
                <span className={active ? "opacity-80" : "text-muted-foreground"}>
                  {count}
                </span>
              </button>
            );
          })}
          <span aria-hidden className="mx-1 h-5 w-px bg-border" />
          {ACTIVITY_FILTERS.map((f) => {
            const count = rows.filter((r) => matches(r, f.key)).length;
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`rounded-full border border-dashed px-3 py-1 text-sm transition-colors ${
                  active
                    ? "border-solid border-foreground bg-foreground text-background"
                    : "hover:bg-accent"
                }`}
              >
                {f.label}{" "}
                <span className={active ? "opacity-80" : "text-muted-foreground"}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="px-3 py-2 font-medium">Learner</th>
              <th className="px-3 py-2 font-medium">Progress</th>
              <th className="px-3 py-2 font-medium">Assigned</th>
              <th className="px-3 py-2 font-medium">Completed</th>
              <th className="px-3 py-2 font-medium">In progress</th>
              <th className="px-3 py-2 font-medium">Not started</th>
              <th className="px-3 py-2 font-medium">Overdue</th>
              <th className="px-3 py-2 font-medium">Latest completed</th>
              <th className="px-3 py-2 font-medium">Last assigned</th>
              <th className="px-3 py-2 font-medium">Last active</th>
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-3 py-8 text-center text-muted-foreground">
                  No learners match this filter.
                </td>
              </tr>
            ) : (
              shown.map((r) => {
                const active = lastActive(r.lastSeenAt);
                const gone = r.status === "deactivated";
                return (
                  <tr
                    key={r.id}
                    className={`border-b last:border-0 hover:bg-accent/40 ${gone ? "opacity-60" : ""}`}
                  >
                    <td className="px-3 py-2">
                      <Link
                        href={`/org/staff/${r.id}`}
                        className="font-medium hover:underline"
                      >
                        {r.name}
                      </Link>
                      {gone && (
                        <span className="ml-2 inline-flex items-center rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">
                          Deactivated
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          r.stats.overdue > 0
                            ? "bg-rose-100 text-rose-700"
                            : r.stats.assigned > 0 && r.stats.completed === r.stats.assigned
                              ? "bg-green-100 text-green-700"
                              : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {r.stats.overallPct}%
                      </span>
                    </td>
                    <td className="px-3 py-2">{r.stats.assigned}</td>
                    <td className="px-3 py-2">{r.stats.completed}</td>
                    <td className="px-3 py-2">{r.stats.inProgress}</td>
                    <td className="px-3 py-2">{r.stats.notStarted}</td>
                    <td className="px-3 py-2">
                      {r.stats.overdue > 0 ? (
                        <span className="font-medium text-rose-600">
                          {r.stats.overdue}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {r.latestCompleted ? (
                        <span>
                          {r.latestCompleted.title}
                          <span className="block text-xs">
                            {fmtDate(r.latestCompleted.date)}
                          </span>
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                      {fmtDate(r.lastAssignedAt)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={active.stale ? "text-rose-600" : "text-muted-foreground"}>
                        {active.label}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={exportCsv}
          className="rounded-lg border px-3 py-1 text-sm font-medium transition-colors hover:bg-accent"
        >
          Export CSV
        </button>
      </div>
    </div>
  );
}
