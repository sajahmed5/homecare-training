"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DragDropBlock as DragDropBlockType } from "@/lib/content";

const selectClass =
  "h-9 rounded-lg border border-input bg-background px-3 text-sm";

export function MatchBlock({ block }: { block: DragDropBlockType }) {
  const matches = block.pairs.map((p) => p.match);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [checked, setChecked] = useState(false);

  function set(i: number, value: string) {
    setAnswers((prev) => ({ ...prev, [i]: value }));
    setChecked(false);
  }

  const allAnswered = block.pairs.every((_, i) => answers[i]);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">{block.prompt}</h2>
      <ul className="space-y-2">
        {block.pairs.map((pair, i) => {
          const isCorrect = answers[i] === pair.match;
          return (
            <li
              key={i}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
            >
              <span className="text-sm font-medium">{pair.item}</span>
              <select
                aria-label={`Match for ${pair.item}`}
                value={answers[i] ?? ""}
                onChange={(e) => set(i, e.target.value)}
                className={cn(
                  selectClass,
                  checked &&
                    (isCorrect
                      ? "border-green-500"
                      : "border-destructive"),
                )}
              >
                <option value="" disabled>
                  Choose…
                </option>
                {matches.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </li>
          );
        })}
      </ul>
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setChecked(true)}
          disabled={!allAnswered}
        >
          Check
        </Button>
        {checked && (
          <span className="text-sm text-muted-foreground">
            {block.pairs.filter((p, i) => answers[i] === p.match).length} /{" "}
            {block.pairs.length} correct
          </span>
        )}
      </div>
    </div>
  );
}
