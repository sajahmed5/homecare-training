"use client";

import { useState } from "react";
import { UserRoundCheck } from "lucide-react";
import { nudgeNeverSignedInAction } from "./nudge-actions";

const DAY = 86_400_000;

function ago(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / DAY);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}

/**
 * Chase everyone who has never signed in. Unlike the overdue nudge this always
 * sends — chasing twice is the point (issue #22) — so the count is shown up
 * front and confirmed before anything goes out: an org that has just imported
 * its staff list can have hundreds in this group.
 */
export function NudgeNeverSignedInButton({
  count,
  lastSentAt,
}: {
  count: number;
  /** When the last sign-in reminder went out, so a repeat is a knowing one. */
  lastSentAt?: string | null;
}) {
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    const res = await nudgeNeverSignedInAction();
    setBusy(false);
    setConfirming(false);
    if (!res.ok) {
      setDone(res.error ?? "Failed");
    } else if (res.reminded === 0 && res.skipped === 0) {
      setDone("Nobody to remind");
    } else {
      setDone(
        `Emailed ${res.reminded}${res.skipped ? `, ${res.skipped} skipped` : ""}`,
      );
    }
  }

  if (done) return <span className="text-xs text-muted-foreground">{done}</span>;

  if (count === 0) {
    return (
      <span className="text-xs text-muted-foreground">
        Everyone has signed in
      </span>
    );
  }

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-2">
        <span className="text-xs text-muted-foreground">
          Email {count} {count === 1 ? "person" : "people"}?
        </span>
        <button
          type="button"
          onClick={run}
          disabled={busy}
          className="rounded-full border border-foreground bg-foreground px-3 py-1 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Sending…" : "Send"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={busy}
          className="rounded-full border px-3 py-1 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-50"
        >
          Cancel
        </button>
      </span>
    );
  }

  return (
    <span className="inline-flex flex-col items-end gap-0.5">
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium transition-colors hover:bg-accent"
      >
        <UserRoundCheck className="size-3.5" />
        Remind {count} never signed in
      </button>
      {lastSentAt && (
        <span className="text-[11px] text-muted-foreground">
          last sent {ago(lastSentAt)}
        </span>
      )}
    </span>
  );
}
