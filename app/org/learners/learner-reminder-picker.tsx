"use client";

import { useMemo, useState } from "react";
import { NudgeButton } from "../nudge-button";

export interface ReminderTarget {
  id: string;
  name: string;
  email: string | null;
  lastRemindedAt: string | null;
  /** Shown as the reason they're worth chasing — overdue, not started, etc. */
  note: string;
}

/**
 * Send a reminder to one person from the reminders page (issue #32).
 *
 * The per-learner Remind button already existed on the learners list, but this
 * is where a manager comes to think about reminders, and the only control here
 * chased an entire group. "Some might not need to be reminded for various
 * reasons" — so the list is searchable and every row sends on its own.
 *
 * Deliberately shows only people with something to chase; the full roll lives
 * one page over and would bury the ones that matter.
 */
export function LearnerReminderPicker({
  learners,
}: {
  learners: ReminderTarget[];
}) {
  const [query, setQuery] = useState("");

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return learners;
    return learners.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        (l.email ?? "").toLowerCase().includes(q),
    );
  }, [learners, query]);

  if (learners.length === 0) {
    return (
      <p className="rounded-xl border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
        Nobody needs chasing — everyone is either up to date or has signed in
        and started.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {learners.length} {learners.length === 1 ? "person" : "people"} worth
          a nudge. Each one sends on its own.
        </p>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name or email…"
          className="w-full max-w-56 rounded-lg border bg-background px-3 py-1 text-sm"
        />
      </div>

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
    </div>
  );
}
