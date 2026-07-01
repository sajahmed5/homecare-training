"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { bulkInviteStaffAction, type BulkState } from "./actions";

interface Row {
  name: string;
  email: string;
  role: string;
}

function parseCsv(text: string): Row[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];

  let idx = { name: 0, email: 1, role: 2 };
  let start = 0;
  if (lines[0].toLowerCase().includes("email")) {
    const cols = lines[0].split(",").map((c) => c.trim().toLowerCase());
    idx = {
      name: cols.indexOf("name"),
      email: cols.indexOf("email"),
      role: cols.indexOf("role"),
    };
    start = 1;
  }

  const rows: Row[] = [];
  for (let i = start; i < lines.length; i++) {
    const cells = lines[i].split(",").map((c) => c.trim());
    const email = (idx.email >= 0 ? cells[idx.email] : cells[1]) ?? "";
    if (!email) continue;
    rows.push({
      name: (idx.name >= 0 ? cells[idx.name] : cells[0]) ?? "",
      email,
      role: (idx.role >= 0 ? cells[idx.role] : cells[2]) || "learner",
    });
  }
  return rows;
}

export function CsvImport() {
  const [rows, setRows] = useState<Row[]>([]);
  const [state, formAction, pending] = useActionState(
    bulkInviteStaffAction,
    {} as BulkState,
  );

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setRows([]);
      return;
    }
    file.text().then((text) => setRows(parseCsv(text)));
  }

  return (
    <form action={formAction} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Upload a CSV with columns <code>name, email, role</code> (role is{" "}
        <code>learner</code> or <code>org_admin</code>). Each person is emailed
        an invite.
      </p>

      <input
        type="file"
        accept=".csv,text/csv"
        onChange={onFile}
        className="block text-sm"
      />
      <input type="hidden" name="rows" value={JSON.stringify(rows)} />

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={pending || rows.length === 0}>
          {pending
            ? "Importing…"
            : rows.length > 0
              ? `Invite ${rows.length} staff`
              : "Invite staff"}
        </Button>

        {state.error && (
          <span className="text-sm text-destructive">{state.error}</span>
        )}
        {state.ok && (
          <span className="text-sm text-green-700 dark:text-green-500">
            {state.created} invited
            {state.failures && state.failures.length > 0
              ? `, ${state.failures.length} failed`
              : ""}
            .
          </span>
        )}
      </div>

      {state.failures && state.failures.length > 0 && (
        <ul className="text-xs text-destructive">
          {state.failures.map((f) => (
            <li key={f.email}>
              {f.email}: {f.error}
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}
