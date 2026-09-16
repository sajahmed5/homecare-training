"use client";

import Link from "next/link";
import { isAssessmentDue } from "@/lib/engine-logic";
import {
  dateColumn,
  newestFirst,
  numberColumn,
  statusRank,
  textColumn,
  type SortColumn,
} from "@/lib/table-sort";
import { SortHeader, useTableSort } from "@/components/sort-header";

export interface TrainingRow {
  userId: string;
  learner: string;
  course: string;
  status: string;
  progress: number;
  /** Certificate issue date = the completion date; enrolments have none. */
  completedAt: string | null;
  assignedAt: string | null;
  dueDate: string | null;
  overdue: boolean;
  late: boolean;
}

function fmtDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  completed: { label: "Completed", cls: "bg-green-100 text-green-700" },
  in_progress: { label: "In progress", cls: "bg-amber-100 text-amber-700" },
  assessment_due: { label: "Assessment due", cls: "bg-indigo-100 text-indigo-700" },
  not_started: { label: "Not started", cls: "bg-slate-100 text-slate-700" },
  expired: { label: "Expired", cls: "bg-rose-100 text-rose-700" },
};

type SortKey = "learner" | "course" | "status" | "progress" | "assigned" | "due";

const SORT_COLUMNS: Record<SortKey, SortColumn<TrainingRow>> = {
  learner: textColumn((r) => r.learner),
  course: textColumn((r) => r.course),
  // Stage first (overdue on top); within a stage, the latest completed on top.
  status: {
    first: "asc",
    value: (r) => statusRank(r.status, r.overdue, isAssessmentDue(r.status, r.progress)),
    tieBreak: newestFirst((r) => r.completedAt),
  },
  progress: numberColumn((r) => (r.status === "completed" ? 100 : r.progress)),
  assigned: dateColumn((r) => r.assignedAt),
  due: dateColumn((r) => r.dueDate),
};

const HEADINGS: { key: SortKey; label: string }[] = [
  { key: "learner", label: "Learner" },
  { key: "course", label: "Course" },
  { key: "status", label: "Status" },
  { key: "progress", label: "Progress" },
  { key: "assigned", label: "Assigned" },
  { key: "due", label: "Due" },
];

/** The assigned-training table itself, with headings that sort (issue #40). */
export function AssignedTrainingRows({ rows }: { rows: TrainingRow[] }) {
  const { sorted, sort, toggle } = useTableSort(rows, SORT_COLUMNS);
  const shown = sorted;
  return (
      <div className="overflow-x-auto rounded-2xl border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              {HEADINGS.map((h) => (
                <SortHeader
                  key={h.key}
                  label={h.label}
                  active={sort?.key === h.key}
                  dir={sort?.dir}
                  onClick={() => toggle(h.key)}
                />
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">
                  Nothing here.
                </td>
              </tr>
            ) : (
              shown.map((r, i) => {
                const key = isAssessmentDue(r.status, r.progress)
                  ? "assessment_due"
                  : r.status;
                const badge = STATUS_BADGE[key] ?? {
                  label: r.status,
                  cls: "bg-slate-100 text-slate-700",
                };
                return (
                  <tr
                    key={`${r.userId}-${r.course}-${i}`}
                    className="border-b last:border-0 hover:bg-accent/40"
                  >
                    <td className="px-3 py-2">
                      <Link
                        href={`/org/staff/${r.userId}`}
                        className="font-medium hover:underline"
                      >
                        {r.learner}
                      </Link>
                    </td>
                    <td className="px-3 py-2">{r.course}</td>
                    <td className="px-3 py-2">
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${badge.cls}`}
                        >
                          {badge.label}
                        </span>
                        {r.overdue && r.status !== "completed" && (
                          <span className="inline-flex rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700">
                            Overdue
                          </span>
                        )}
                        {r.late && (
                          <span className="inline-flex rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                            Late
                          </span>
                        )}
                      </span>
                      {/* When it was finished, next to the status (issue #23). */}
                      {r.completedAt && (
                        <span className="block whitespace-nowrap text-xs text-muted-foreground">
                          {fmtDate(r.completedAt)}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {r.status === "completed" ? "100%" : `${r.progress}%`}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                      {fmtDate(r.assignedAt)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span
                        className={
                          r.overdue
                            ? "font-medium text-rose-600"
                            : "text-muted-foreground"
                        }
                      >
                        {fmtDate(r.dueDate)}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
  );
}
