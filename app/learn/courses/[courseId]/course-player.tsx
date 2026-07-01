"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BlockRenderer } from "@/components/content/block-renderer";
import { blockLabel, type ContentBlock } from "@/lib/content";
import { saveProgressAction } from "@/app/learn/actions";

// Isolated so the impure clock read stays out of the component/hook bodies.
const nowMs = () => Date.now();

export function CoursePlayer({
  enrolmentId,
  title,
  blocks,
  initialBlock,
}: {
  enrolmentId: string;
  title: string;
  blocks: ContentBlock[];
  initialBlock: number;
}) {
  const router = useRouter();
  const total = blocks.length;
  const [index, setIndex] = useState(
    Math.min(Math.max(0, initialBlock), Math.max(0, total - 1)),
  );
  const [finished, setFinished] = useState(false);
  const startRef = useRef(nowMs());

  const persist = useCallback(
    (nextIndex: number, done = false) => {
      const delta = Math.round((nowMs() - startRef.current) / 1000);
      startRef.current = nowMs();
      const reached = Math.max(nextIndex, index) + 1;
      const pct = done ? 100 : Math.round((reached / total) * 100);
      // Fire-and-forget; RLS ensures it only touches this learner's row.
      void saveProgressAction({
        enrolmentId,
        currentBlock: nextIndex,
        progress: pct,
        timeSpentDelta: delta,
      });
    },
    [enrolmentId, index, total],
  );

  // Best-effort save if the tab is hidden/closed mid-course.
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === "hidden") persist(index);
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [index, persist]);

  if (total === 0) {
    return (
      <p className="text-muted-foreground">
        This course has no content yet.
      </p>
    );
  }

  const block = blocks[index];
  const pct = Math.round(((index + 1) / total) * 100);

  function next() {
    if (index < total - 1) {
      const n = index + 1;
      setIndex(n);
      persist(n);
    } else {
      persist(total - 1, true);
      setFinished(true);
    }
  }

  function back() {
    if (index > 0) {
      const n = index - 1;
      setIndex(n);
      persist(n);
    }
  }

  if (finished) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 text-center">
        <h2 className="text-2xl font-semibold">Content complete</h2>
        <p className="text-muted-foreground">
          You&apos;ve worked through all of <strong>{title}</strong>. The graded
          assessment and certificate arrive in Phase 5 — for now your progress is
          saved.
        </p>
        <Button onClick={() => router.push("/learn")}>Back to my training</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <Link href="/learn" className="hover:underline">
            ← My training
          </Link>
          <span>
            {blockLabel(block)} · {index + 1} of {total}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="min-h-[220px] rounded-xl border p-6">
        <BlockRenderer block={block} />
      </div>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={back} disabled={index === 0}>
          Back
        </Button>
        <Button onClick={next}>
          {index < total - 1 ? "Next" : "Finish"}
        </Button>
      </div>
    </div>
  );
}
