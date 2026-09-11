"use client";

import { useMemo, useState } from "react";
import { BellRing } from "lucide-react";
import { NudgeButton } from "../nudge-button";
import { nudgeGroupAction } from "../nudge-actions";
import { NUDGE_GROUPS, type NudgeGroup } from "../nudge-types";

export interface ReminderTarget {
  id: string;
  name: string;
  email: string | null;
  lastRemindedAt: string | null;
  /** Why they're listed — "2 overdue", "Never signed in". */
  note: string;
  /** Which bulk groups they fall in; drives the picker. */
  groups: NudgeGroup[];
}

/** How each group reads when it's empty — "Nobody is never signed in" was not English. */
const EMPTY: Record<NudgeGroup | "all", string> = {
  all: "Nobody needs chasing right now.",
  overdue: "No staff have overdue training.",
  not_started: "No staff have training they haven't started.",
  never_signed_in: "Everyone has signed in.",
};

/**
 * Pick a group, see exactly who's in it, then send (issue #38).
 *
 * This replaces two controls that looked connected and weren't: a group
 * dropdown sat directly above a list of people, so choosing a group read as
 * filtering the list — and did nothing to it. The same mistake as #31, made
 * twice. Now the dropdown IS the list's filter, so nobody can email a group
 * without first seeing everyone in it.
 *
 * "Everyone" is for browsing and sending one at a time; the send-to-all button
 * only appears once a specific group is chosen, because the groups get
 * different emails (a never-signed-in person gets a set-password link, not a
 * "finish your training" nudge).
 */
export function LearnerReminderPicker({
  learners,
}: {
  learners: ReminderTarget[];
}) {
  const [group, setGroup] = useState<NudgeGroup | "all">("all");
  const [query, setQuery] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  const inGroup = useMemo(
    () =>
      group === "all"
        ? learners
        : learners.filter((l) => l.groups.includes(group)),
    [learners, group],
  );

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return inGroup;
    return inGroup.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        (l.email ?? "").toLowerCase().includes(q),
    );
  }, [inGroup, query]);

  const count = (g: NudgeGroup | "all") =>
    g === "all" ? learners.length : learners.filter((l) => l.groups.includes(g)).length;

  async function sendAll() {
    if (group === "all") return;
    setBusy(true);
    const res = await nudgeGroupAction(group, true);
    setBusy(false);
    setConfirming(false);
    setDone(
      !res.ok
        ? (res.error ?? "Failed")
        : `Emailed ${res.reminded}${res.skipped ? `, ${res.skipped} skipped` : ""}.`,
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={group}
          onChange={(e) => {
            setGroup(e.target.value as NudgeGroup | "all");
            setConfirming(false);
            setDone(null);
          }}
          className="min-h-11 rounded-lg border bg-background px-2 py-1 text-sm sm:min-h-0"
          aria-label="Choose who to show"
        >
          <option value="all">Everyone worth chasing ({count("all")})</option>
          {NUDGE_GROUPS.map((g) => (
            <option key={g.key} value={g.key}>
              {g.label} ({count(g.key)})
            </option>
          ))}
        </select>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name or email…"
          className="min-h-11 w-full max-w-56 rounded-lg border bg-background px-3 py-1 text-sm sm:ml-auto sm:min-h-0"
        />
      </div>

      {/* Send to the whole group — only once a group is chosen, and only after
          the manager has seen the list directly below. */}
      {group !== "all" && inGroup.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-muted/40 px-3 py-2 text-sm">
          {done ? (
            <span className="text-muted-foreground">{done}</span>
          ) : confirming ? (
            <>
              <span>
                Email all {inGroup.length}{" "}
                {inGroup.length === 1 ? "person" : "people"} listed below?
              </span>
              <button
                type="button"
                onClick={sendAll}
                disabled={busy}
                className="min-h-11 rounded-full border border-foreground bg-foreground px-3 py-1 font-medium text-background disabled:opacity-50 sm:min-h-0"
              >
                {busy ? "Sending…" : "Send"}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={busy}
                className="min-h-11 rounded-full border px-3 py-1 font-medium hover:bg-accent disabled:opacity-50 sm:min-h-0"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <span className="text-muted-foreground">
                {NUDGE_GROUPS.find((g) => g.key === group)?.blurb}
              </span>
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="ml-auto inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3 py-1 font-medium hover:bg-accent sm:min-h-0"
              >
                <BellRing className="size-3.5" />
                Send to all {inGroup.length}
              </button>
            </>
          )}
        </div>
      )}

      {inGroup.length === 0 ? (
        <p className="rounded-xl border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
          {EMPTY[group]}
        </p>
      ) : (
        <ul className="max-h-80 divide-y overflow-y-auto rounded-xl border">
          {shown.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground">
              Nobody matches that search.
            </li>
          ) : (
            shown.map((l) => (
              <li
                key={l.id}
                className="flex flex-wrap items-center justify-between gap-2 px-3 py-2"
              >
                <span className="min-w-0">
                  <span className="text-sm font-medium">{l.name}</span>{" "}
                  <span className="text-xs text-muted-foreground">{l.email}</span>
                  <span className="block text-xs text-muted-foreground">
                    {l.note}
                  </span>
                </span>
                <NudgeButton
                  userId={l.id}
                  size="xs"
                  lastRemindedAt={l.lastRemindedAt}
                />
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
