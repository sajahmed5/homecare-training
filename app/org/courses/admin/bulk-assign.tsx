"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { parseAssignCsv, type AssignCsvRow } from "@/lib/assign";
import { bulkAssignTrainingAction, type BulkAssignState } from "../../actions";

/** Assign courses to staff in bulk from a CSV (email, course, due date). */
export function BulkAssign() {
  const [rows, setRows] = useState<AssignCsvRow[]>([]);
  const [fileProblem, setFileProblem] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState(
    bulkAssignTrainingAction,
    {} as BulkAssignState,
  );

  function downloadTemplate() {
    const csv =
      "email,course,due date\r\njane.smith@example.com,Fire Safety,31/08/2026\r\njane.smith@example.com,Whistleblowing,\r\n";
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bulk-assign-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setRows([]);
    setFileProblem(null);
    if (!file) return;
    if (/\.xlsx?$/i.test(file.name)) {
      setFileProblem(
        "That's an Excel file. In Excel choose File → Save As → CSV, then upload the .csv.",
      );
      return;
    }
    file.text().then((text) => {
      if (text.startsWith("PK")) {
        setFileProblem(
          "That's an Excel file. In Excel choose File → Save As → CSV, then upload the .csv.",
        );
        return;
      }
      const { rows: parsed, problem } = parseAssignCsv(text);
      setRows(parsed);
      setFileProblem(problem ?? null);
    });
  }

  const bad = rows.filter((r) => r.problem);

  return (
    <form action={formAction} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        One row per person per course: <code>email, course, due date</code>.
        The course must match its title exactly; leave the due date blank to
        use the end of this month.
      </p>

      <button
        type="button"
        onClick={downloadTemplate}
        className="rounded-lg border px-3 py-1 text-sm font-medium transition-colors hover:bg-accent"
      >
        Download template CSV
      </button>

      <input
        type="file"
        accept=".csv,text/csv"
        onChange={onFile}
        className="block text-sm"
      />
      <input type="hidden" name="rows" value={JSON.stringify(rows)} />

      {fileProblem && <p className="text-sm text-destructive">{fileProblem}</p>}

      {rows.length > 0 && (
        <div className="max-h-48 overflow-y-auto rounded-lg border">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="px-2 py-1 font-medium">Email</th>
                <th className="px-2 py-1 font-medium">Course</th>
                <th className="px-2 py-1 font-medium">Due date</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={`${r.email}-${r.course}-${i}`}
                  className={`border-b last:border-0 ${r.problem ? "text-destructive" : ""}`}
                >
                  <td className="px-2 py-1">{r.email || "—"}</td>
                  <td className="px-2 py-1">{r.course || "—"}</td>
                  <td className="px-2 py-1">
                    {r.problem ?? r.dueDate ?? "end of month"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {rows.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {rows.length} assignment(s) ready
          {bad.length > 0 ? ` — ${bad.length} highlighted in red will be skipped` : ""}
          .
        </p>
      )}

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={pending || rows.length === 0}>
          {pending
            ? "Assigning…"
            : rows.length > 0
              ? `Assign ${rows.length} course(s)`
              : "Assign courses"}
        </Button>
        {state.error && (
          <span className="text-sm text-destructive">{state.error}</span>
        )}
        {state.ok && (
          <span className="text-sm text-green-700 dark:text-green-500">
            {state.assigned} assigned
            {state.failures && state.failures.length > 0
              ? `, ${state.failures.length} failed`
              : ""}
            .
          </span>
        )}
      </div>

      {state.failures && state.failures.length > 0 && (
        <ul className="text-xs text-destructive">
          {state.failures.map((f, i) => (
            <li key={`${f.line}-${i}`}>
              {f.line}: {f.error}
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}
