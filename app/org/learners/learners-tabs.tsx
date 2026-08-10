"use client";

import { useState, type ReactNode } from "react";

/**
 * Tab switcher for the learners page: the learner list and the reminder
 * history (issue #13). Both panes are server-rendered and passed in as nodes.
 */
export function LearnersTabs({
  learners,
  reminders,
  reminderCount,
}: {
  learners: ReactNode;
  reminders: ReactNode;
  reminderCount: number;
}) {
  const [tab, setTab] = useState<"learners" | "reminders">("learners");

  const tabClass = (active: boolean) =>
    `rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
      active ? "bg-foreground text-background" : "hover:bg-accent"
    }`;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1 rounded-xl border bg-card p-1 w-fit">
        <button
          type="button"
          className={tabClass(tab === "learners")}
          onClick={() => setTab("learners")}
        >
          Learners
        </button>
        <button
          type="button"
          className={tabClass(tab === "reminders")}
          onClick={() => setTab("reminders")}
        >
          Reminders sent{" "}
          <span className={tab === "reminders" ? "opacity-80" : "text-muted-foreground"}>
            {reminderCount}
          </span>
        </button>
      </div>
      <div className={tab === "learners" ? "" : "hidden"}>{learners}</div>
      <div className={tab === "reminders" ? "" : "hidden"}>{reminders}</div>
    </div>
  );
}
