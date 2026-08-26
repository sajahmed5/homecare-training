"use client";

import { useState } from "react";
import { BellRing } from "lucide-react";
import { remindRenewalAction } from "./renewal-actions";

/**
 * Chase one certificate's renewal. Confirms first: this emails a real carer,
 * and the row it sits on is one of many.
 */
export function RenewButton({
  certificateId,
  learner,
  course,
}: {
  certificateId: string;
  learner: string;
  course: string;
}) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  async function run() {
    if (
      !window.confirm(
        `Email ${learner} about renewing ${course}?`,
      )
    ) {
      return;
    }
    setBusy(true);
    const res = await remindRenewalAction(certificateId);
    setBusy(false);
    setDone(res.ok ? (res.message ?? "Sent") : (res.error ?? "Failed"));
  }

  if (done) return <span className="text-xs text-muted-foreground">{done}</span>;

  return (
    <button
      type="button"
      onClick={run}
      disabled={busy}
      className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors hover:bg-accent disabled:opacity-50"
    >
      <BellRing className="size-3.5" />
      {busy ? "Sending…" : "Remind"}
    </button>
  );
}
