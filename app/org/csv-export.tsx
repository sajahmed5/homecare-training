"use client";

import { Button } from "@/components/ui/button";

export interface ExportRow {
  full_name: string | null;
  email: string;
  role: string;
  status: string;
}

function cell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function CsvExport({
  rows,
  filename,
}: {
  rows: ExportRow[];
  filename: string;
}) {
  function download() {
    const header = "name,email,role,status";
    const body = rows
      .map((r) =>
        [r.full_name ?? "", r.email, r.role, r.status].map(cell).join(","),
      )
      .join("\n");
    const blob = new Blob([`${header}\n${body}`], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button variant="outline" size="sm" onClick={download} disabled={rows.length === 0}>
      Export CSV
    </Button>
  );
}
