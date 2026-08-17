"use client";

import Link from "next/link";
import type { CourseEnrolmentRow } from "@/lib/course-stats";
import { formatDuration } from "@/lib/org-learner";

const csvCell = (v: string) =>
  /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;

function fmtTime(seconds: number | null): string {
  return seconds === null ? "—" : formatDuration(seconds);
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  completed: { label: "Completed", cls: "bg-green-100 text-green-700" },
  in_progress: { label: "In progress", cls: "bg-amber-100 text-amber-700" },
  not_started: { label: "Not started", cls: "bg-slate-100 text-slate-700" },
  expired: { label: "Expired", cls: "bg-rose-100 text-rose-700" },
};

/**
 * The raw enrolment rows behind the Courses → Overview table: one per
 * learner × course. Actual duration is shown for completed rows only, so the
 * column's min/max/mean are exactly the shortest/longest/average the Overview
 * reports.
 */
export function CourseEnrolmentsTable({
  rows,
  filename = "course-enrolments.csv",
}: {
  rows: CourseEnrolmentRow[];
  filename?: string;
}) {
  const actual = (r: CourseEnrolmentRow) =>
    r.status === "completed" ? r.actualSeconds : null;

  function exportCsv() {
    const header = [
      "Course",
      "Learner",
      "Status",
      "Attempts",
      "Expected duration",
      "Actual duration",
    ];
    const body = rows.map((r) =>
      [
        r.course,
        r.learner,
        STATUS_BADGE[r.status]?.label ?? r.status,
        String(r.attempts),
        fmtTime(r.expectedSeconds),
        fmtTime(actual(r)),
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
              <th className="px-3 py-2 font-medium">Learner</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Attempts</th>
              <th className="px-3 py-2 font-medium">Expected Duration</th>
              <th className="px-3 py-2 font-medium">Actual Duration</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">
                  No course activity yet.
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const badge = STATUS_BADGE[r.status] ?? {
                  label: r.status,
                  cls: "bg-slate-100 text-slate-700",
                };
                return (
                  <tr
                    key={`${r.userId}-${r.courseId}`}
                    className="border-b last:border-0 hover:bg-accent/40"
                  >
                    <td className="px-3 py-2">
                      <Link
                        href={`/org/coverage?course=${r.courseId}`}
                        className="font-medium hover:underline"
                        title="Who has and hasn't completed this course"
                      >
                        {r.course}
                      </Link>
                    </td>
                    <td className="px-3 py-2">
                      <Link
                        href={`/org/staff/${r.userId}`}
                        className="font-medium hover:underline"
                      >
                        {r.learner}
                      </Link>
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${badge.cls}`}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-3 py-2">{r.attempts}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {fmtTime(r.expectedSeconds)}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {fmtTime(actual(r))}
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
