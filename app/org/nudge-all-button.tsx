"use client";

import { useState } from "react";
import { BellRing } from "lucide-react";
import { nudgeAllOverdueAction } from "./nudge-actions";

export function NudgeAllButton() {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    const res = await nudgeAllOverdueAction();
    setBusy(false);
    if (!res.ok) {
      setDone(res.error ?? "Failed");
    } else if (res.reminded === 0 && res.skipped === 0) {
      setDone("Nobody overdue");
    } else {
      setDone(
        `Reminded ${res.reminded}${res.skipped ? `, ${res.skipped} skipped` : ""}`,
      );
    }
  }

  if (done) return <span className="text-xs text-muted-foreground">{done}</span>;

  return (
    <button
      type="button"
      onClick={run}
      disabled={busy}
      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-50"
    >
      <BellRing className="size-3.5" />
      {busy ? "Reminding…" : "Remind all overdue"}
    </button>
  );
}
