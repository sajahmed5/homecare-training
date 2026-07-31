"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { nudgeOrgAdminsAction } from "./org-nudge-actions";

export function OrgNudgeButton({
  orgId,
  size = "sm",
}: {
  orgId: string;
  size?: "sm" | "xs";
}) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    const res = await nudgeOrgAdminsAction(orgId);
    setBusy(false);
    setDone(
      res.skipped
        ? "Already nudged"
        : res.ok
          ? (res.message ?? "Nudged ✓")
          : (res.error ?? "Failed"),
    );
  }

  if (done) return <span className="text-xs text-muted-foreground">{done}</span>;

  return (
    <button
      type="button"
      onClick={run}
      disabled={busy}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-medium transition-colors hover:bg-accent disabled:opacity-50 ${
        size === "xs" ? "text-xs" : "text-sm"
      }`}
    >
      <Send className="size-3.5" />
      {busy ? "Sending…" : "Nudge admins"}
    </button>
  );
}
