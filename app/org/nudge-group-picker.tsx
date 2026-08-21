"use client";

import { useState } from "react";
import { BellRing } from "lucide-react";
import { nudgeGroupAction } from "./nudge-actions";
import { NUDGE_GROUPS, type NudgeGroup } from "./nudge-types";

/**
 * Pick who to chase, rather than only ever "everyone overdue" (issue #17.3).
 * The headcount for the chosen group is shown before sending and confirmed
 * after, because these send real email to real carers — and this always sends,
 * even to someone reminded an hour ago, which is what was asked for.
 */
export function NudgeGroupPicker({
  counts,
}: {
  /** How many learners are in each group, for the label and the confirm. */
  counts: Record<NudgeGroup, number>;
}) {
  const [group, setGroup] = useState<NudgeGroup>("overdue");
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  const count = counts[group] ?? 0;
  const chosen = NUDGE_GROUPS.find((g) => g.key === group)!;

  async function run() {
    setBusy(true);
    const res = await nudgeGroupAction(group, true);
    setBusy(false);
    setConfirming(false);
    setDone(
      !res.ok
        ? (res.error ?? "Failed")
        : res.reminded === 0 && res.skipped === 0
          ? "Nobody in that group"
          : `Emailed ${res.reminded}${res.skipped ? `, ${res.skipped} skipped` : ""}`,
    );
  }

  return (
    <div className="flex flex-col items-start gap-1.5 sm:items-end">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={group}
          disabled={busy || confirming}
          onChange={(e) => {
            setGroup(e.target.value as NudgeGroup);
            setDone(null);
            setConfirming(false);
          }}
          className="rounded-lg border bg-background px-2 py-1 text-sm disabled:opacity-50"
        >
          {NUDGE_GROUPS.map((g) => (
            <option key={g.key} value={g.key}>
              {g.label} ({counts[g.key] ?? 0})
            </option>
          ))}
        </select>

        {confirming ? (
          <>
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
          </>
        ) : (
          <button
            type="button"
            onClick={() => {
              setDone(null);
              setConfirming(true);
            }}
            disabled={count === 0}
            className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-50"
          >
            <BellRing className="size-3.5" />
            Send reminder
          </button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {done ?? (count === 0 ? `Nobody is ${chosen.label.toLowerCase()}` : chosen.blurb)}
      </p>
    </div>
  );
}
