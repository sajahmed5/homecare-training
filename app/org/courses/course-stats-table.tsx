"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { isUnused, type CourseStatsRow } from "@/lib/course-stats";
import { formatDuration } from "@/lib/org-learner";

const csvCell = (v: string) =>
  /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;

function fmtTime(seconds: number | null): string {
  return seconds === null ? "—" : formatDuration(seconds);
}

/** Per-course statistics with time-to-complete columns and CSV export. */
export function CourseStatsTable({
  rows: allRows,
  filename = "course-statistics.csv",
}: {
  rows: CourseStatsRow[];
  filename?: string;
}) {
  // "In use" is the default because it is the usual question. "All courses"
  // exists because the other question — what could I assign? — had no answer
  // anywhere in the product (issue #33).
  const [scope, setScope] = useState<"used" | "all">("used");
  const [query, setQuery] = useState("");
  const used = useMemo(() => allRows.filter((c) => !isUnused(c)), [allRows]);

  const rows = useMemo(() => {
    const base = scope === "all" ? allRows : used;
    const q = query.trim().toLowerCase();
    return q ? base.filter((c) => c.title.toLowerCase().includes(q)) : base;
  }, [allRows, used, scope, query]);
  function exportCsv() {
    const header = [
      "Course",
      "Staff assigned",
      "Attempts",
      "In progress",
      "Completions",
      "Expected duration",
      "Shortest duration",
      "Longest duration",
      "Average duration",
    ];
    const body = rows.map((r) =>
      [
        r.title,
        String(r.assigned),
        String(r.attempts),
        String(r.inProgress),
        String(r.completions),
        fmtTime(r.expectedSeconds),
        fmtTime(r.quickestSeconds),
        fmtTime(r.longestSeconds),
        fmtTime(r.averageSeconds),
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
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            { key: "used", label: "In use", count: used.length },
            { key: "all", label: "All courses", count: allRows.length },
          ] as const
        ).map((t) => {
          const active = scope === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setScope(t.key)}
              className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                active
                  ? "border-foreground bg-foreground text-background"
                  : "hover:bg-accent"
              }`}
            >
              {t.label}{" "}
              <span className={active ? "opacity-80" : "text-muted-foreground"}>
                {t.count}
              </span>
            </button>
          );
        })}
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search courses…"
          className="ml-auto w-full max-w-56 rounded-lg border bg-background px-3 py-1 text-sm"
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="px-3 py-2 font-medium">Course</th>
              <th className="px-3 py-2 font-medium">Staff assigned</th>
              <th className="px-3 py-2 font-medium">Attempts</th>
              <th className="px-3 py-2 font-medium">In progress</th>
              <th className="px-3 py-2 font-medium">Completions</th>
              <th className="px-3 py-2 font-medium">Expected Duration</th>
              <th className="px-3 py-2 font-medium">Shortest Duration</th>
              <th className="px-3 py-2 font-medium">Longest Duration</th>
              <th className="px-3 py-2 font-medium">Average Duration</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-muted-foreground">
                  No courses match this search.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-b last:border-0 hover:bg-accent/40">
                  <td className="px-3 py-2">
                    <Link
                      href={`/org/courses/statistics?course=${r.id}`}
                      className="font-medium hover:underline"
                      title="Every learner on this course"
                    >
                      {r.title}
                    </Link>
                    {isUnused(r) && (
                      <span className="ml-2 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        Not assigned
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">{r.assigned}</td>
                  <td className="px-3 py-2">{r.attempts}</td>
                  <td className="px-3 py-2">{r.inProgress}</td>
                  <td className="px-3 py-2">{r.completions}</td>
                  <td className="px-3 py-2 text-muted-foreground">{fmtTime(r.expectedSeconds)}</td>
                  <td className="px-3 py-2 text-muted-foreground">{fmtTime(r.quickestSeconds)}</td>
                  <td className="px-3 py-2 text-muted-foreground">{fmtTime(r.longestSeconds)}</td>
                  <td className="px-3 py-2 text-muted-foreground">{fmtTime(r.averageSeconds)}</td>
                </tr>
              ))
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
