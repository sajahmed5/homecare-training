"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { exportTrainingMatrixAction } from "./matrix-actions";

// Escape one CSV cell (quote if it contains a comma, quote or newline).
const cell = (v: string) =>
  /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;

export function MatrixExport({ filename }: { filename: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function download() {
    setBusy(true);
    setError(null);
    try {
      const { courses, rows } = await exportTrainingMatrixAction();
      const header = ["Carer", "Email", ...courses.map((c) => c.title)]
        .map(cell)
        .join(",");
      const body = rows.map((r) =>
        [r.name, r.email, ...courses.map((c) => r.cells[c.id] ?? "")]
          .map(cell)
          .join(","),
      );
      // BOM so Excel reads UTF-8 (accents, the → arrow) correctly.
      const csv = "﻿" + [header, ...body].join("\r\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Couldn't build the matrix. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="outline" size="sm" onClick={download} disabled={busy}>
        {busy ? "Preparing…" : "Training matrix (CSV)"}
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}
