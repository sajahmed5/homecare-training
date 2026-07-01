"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { FillGapBlock as FillGapBlockType } from "@/lib/content";

export function FillGapBlock({ block }: { block: FillGapBlockType }) {
  const [value, setValue] = useState("");
  const [checked, setChecked] = useState(false);

  const accepted = block.answers.map((a) => a.trim().toLowerCase());
  const correct = accepted.includes(value.trim().toLowerCase());
  const [before, after] = block.text.split("___");

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Fill the gap</h2>
      <p className="flex flex-wrap items-center gap-2 text-base leading-8">
        <span>{before}</span>
        <Input
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setChecked(false);
          }}
          className="inline-block w-40"
          aria-label="Missing word"
        />
        <span>{after}</span>
      </p>
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setChecked(true)}
          disabled={!value.trim()}
        >
          Check
        </Button>
        {checked && (
          <span
            className={
              correct
                ? "text-sm text-green-700 dark:text-green-500"
                : "text-sm text-destructive"
            }
          >
            {correct
              ? "Correct."
              : `Try again — accepted answer: ${block.answers[0]}`}
          </span>
        )}
      </div>
    </div>
  );
}
