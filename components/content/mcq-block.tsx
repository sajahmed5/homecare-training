"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { McqBlock as McqBlockType } from "@/lib/content";

export function McqBlock({ block }: { block: McqBlockType }) {
  const [choice, setChoice] = useState<number | null>(null);
  const answered = choice !== null;
  const correct = choice === block.answerIndex;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">{block.question}</h2>
      <div className="space-y-2">
        {block.options.map((option, i) => {
          const isChosen = choice === i;
          const isAnswer = i === block.answerIndex;
          return (
            <button
              key={i}
              type="button"
              disabled={answered}
              onClick={() => setChoice(i)}
              className={cn(
                "w-full rounded-lg border px-4 py-3 text-left text-sm transition-colors",
                !answered && "hover:bg-muted",
                answered && isAnswer && "border-green-500 bg-green-500/10",
                answered &&
                  isChosen &&
                  !isAnswer &&
                  "border-destructive bg-destructive/10",
              )}
            >
              {option}
            </button>
          );
        })}
      </div>
      {answered && (
        <p
          className={cn(
            "text-sm",
            correct
              ? "text-green-700 dark:text-green-500"
              : "text-destructive",
          )}
        >
          {correct ? "Correct." : "Not quite — the highlighted answer is correct."}
        </p>
      )}
    </div>
  );
}
