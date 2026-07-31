"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { nudgeLearnerAction } from "./nudge-actions";

export function NudgeButton({
  userId,
  size = "sm",
}: {
  userId: string;
  size?: "sm" | "xs";
}) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  async function nudge() {
    setBusy(true);
    const res = await nudgeLearnerAction(userId);
    setBusy(false);
    setDone(res.skipped ? "Already reminded" : res.ok ? "Reminded ✓" : (res.error ?? "Failed"));
  }

  if (done) {
    return <span className="text-xs text-muted-foreground">{done}</span>;
  }

  return (
    <button
      type="button"
      onClick={nudge}
      disabled={busy}
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-medium transition-colors hover:bg-accent disabled:opacity-50 ${
        size === "xs" ? "text-xs" : "text-sm"
      }`}
    >
      <Bell className="size-3.5" />
      {busy ? "Sending…" : "Remind"}
    </button>
  );
}
