"use client";

import Link from "next/link";
import type { CourseStatsRow } from "@/lib/course-stats";
import { formatDuration } from "@/lib/org-learner";

const csvCell = (v: string) =>
  /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;

function fmtTime(seconds: number | null): string {
  return seconds === null ? "—" : formatDuration(seconds);
}

/** Per-course statistics with time-to-complete columns and CSV export. */
export function CourseStatsTable({
  rows,
  filename = "course-statistics.csv",
}: {
  rows: CourseStatsRow[];
  filename?: string;
}) {
  function exportCsv() {
    const header = [
      "Course",
      "Staff assigned",
      "Attempts",
      "In progress",
      "Completions",
      "Quickest completion",
      "Longest completion",
      "Average completion",
    ];
    const body = rows.map((r) =>
      [
        r.title,
        String(r.assigned),
        String(r.attempts),
        String(r.inProgress),
        String(r.completions),
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
      <div className="overflow-x-auto rounded-2xl border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="px-3 py-2 font-medium">Course</th>
              <th className="px-3 py-2 font-medium">Staff assigned</th>
              <th className="px-3 py-2 font-medium">Attempts</th>
              <th className="px-3 py-2 font-medium">In progress</th>
              <th className="px-3 py-2 font-medium">Completions</th>
              <th className="px-3 py-2 font-medium">Quickest</th>
              <th className="px-3 py-2 font-medium">Longest</th>
              <th className="px-3 py-2 font-medium">Average</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">
                  No course activity yet.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-b last:border-0 hover:bg-accent/40">
                  <td className="px-3 py-2">
                    <Link
                      href={`/org/coverage?course=${r.id}`}
                      className="font-medium hover:underline"
                      title="Who has and hasn't completed this course"
                    >
                      {r.title}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{r.assigned}</td>
                  <td className="px-3 py-2">{r.attempts}</td>
                  <td className="px-3 py-2">{r.inProgress}</td>
                  <td className="px-3 py-2">{r.completions}</td>
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
