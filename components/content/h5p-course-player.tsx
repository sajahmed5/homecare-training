"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { saveProgressAction } from "@/app/learn/actions";
import type { H5PBlock } from "@/lib/content";

// Isolate the impure clock read from the component/hook bodies.
const nowMs = () => Date.now();

interface XapiEvent {
  getVerb?: () => string | undefined;
  data?: { statement?: { object?: { id?: string } } };
}
interface H5PGlobal {
  externalDispatcher?: {
    on: (event: string, cb: (e: XapiEvent) => void) => void;
  };
}
declare global {
  interface Window {
    H5P?: H5PGlobal;
  }
}

/**
 * Plays a course whose content is an ordered list of H5P packages ("pages"),
 * one per screen, with our own progress bar, Back/Next navigation and a
 * "Save & come back later" button. Resumes at the learner's saved page.
 */
export function H5PCoursePlayer({
  enrolmentId,
  courseId,
  title,
  pages,
  initialBlock,
}: {
  enrolmentId: string;
  courseId: string;
  title: string;
  pages: H5PBlock[];
  initialBlock: number;
}) {
  const router = useRouter();
  const total = pages.length;
  const containerRef = useRef<HTMLDivElement>(null);
  const startRef = useRef(nowMs());
  const startIndex = Math.min(Math.max(0, initialBlock), total - 1);
  const [index, setIndex] = useState(startIndex);
  const [reached, setReached] = useState(startIndex);
  const [loading, setLoading] = useState(true);
  const [finished, setFinished] = useState(false);

  // Track which questions on the current page have been answered (by xAPI
  // object id) so we can require them before "Next".
  const answeredRef = useRef<Set<string>>(new Set());
  const [answeredCount, setAnsweredCount] = useState(0);

  const progressPct = Math.round(((Math.max(reached, index) + 1) / total) * 100);

  const requiredQuestions = pages[index].questions ?? 0;
  // Only gate on a page the learner is reaching for the first time; revisiting
  // an earlier page (index < reached) never blocks navigation.
  const gated = requiredQuestions > 0 && index >= reached && answeredCount < requiredQuestions;

  // Persist current position + progress (fire-and-forget; RLS scopes it).
  const persist = useCallback(
    (pageIndex: number, done = false) => {
      const newReached = Math.max(reached, pageIndex);
      setReached(newReached);
      const delta = Math.round((nowMs() - startRef.current) / 1000);
      startRef.current = nowMs();
      const pct = done ? 100 : Math.round(((newReached + 1) / total) * 100);
      void saveProgressAction({
        enrolmentId,
        currentBlock: pageIndex,
        progress: pct,
        timeSpentDelta: delta,
      });
    },
    [enrolmentId, total, reached],
  );

  // Listen once for H5P xAPI "answered"/"completed" statements and record the
  // distinct interactions answered on the current page.
  useEffect(() => {
    let cancelled = false;
    const timer = setInterval(() => {
      const dispatcher = window.H5P?.externalDispatcher;
      if (cancelled || !dispatcher) return;
      clearInterval(timer);
      dispatcher.on("xAPI", (e) => {
        const verb = e.getVerb?.();
        if (verb !== "answered" && verb !== "completed") return;
        const id = e.data?.statement?.object?.id ?? `q-${answeredRef.current.size}`;
        if (!answeredRef.current.has(id)) {
          answeredRef.current.add(id);
          setAnsweredCount(answeredRef.current.size);
        }
      });
    }, 200);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  // (Re)mount the H5P package whenever the page changes.
  useEffect(() => {
    let disposed = false;
    const el = containerRef.current;
    if (!el) return;
    el.innerHTML = "";
    // Reset the answered-question tracker for the new page.
    answeredRef.current = new Set();
    setAnsweredCount(0);
    setLoading(true);
    (async () => {
      try {
        const { H5P } = await import("h5p-standalone");
        if (disposed) return;
        await new H5P(el, {
          h5pJsonPath: `/h5p/content/${pages[index].path}`,
          librariesPath: "/h5p/libraries",
          frameJs: "/h5p/assets/frame.bundle.js",
          frameCss: "/h5p/assets/styles/h5p.css",
        });
        if (!disposed) setLoading(false);
      } catch (err) {
        console.error("H5P load failed", err);
        if (!disposed) setLoading(false);
      }
    })();
    return () => {
      disposed = true;
    };
  }, [index, pages]);

  // Best-effort save if the learner leaves mid-page.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") persist(index);
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [index, persist]);

  function goTo(next: number) {
    setIndex(next);
    persist(next);
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  }

  function next() {
    if (index < total - 1) goTo(index + 1);
    else {
      persist(total - 1, true);
      setFinished(true);
    }
  }

  function saveAndExit() {
    persist(index);
    router.push("/learn");
  }

  if (finished) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 py-6 text-center">
        <div className="text-4xl">🎉</div>
        <h2 className="text-2xl font-semibold">You&apos;ve finished the module</h2>
        <p className="text-muted-foreground">
          Great work completing <strong>{title}</strong>. Now take the assessment
          to earn your certificate.
        </p>
        <div className="flex justify-center gap-3">
          <Button onClick={() => router.push(`/learn/courses/${courseId}/quiz`)}>
            Start assessment
          </Button>
          <Button variant="outline" onClick={() => router.push("/learn")}>
            Back to my training
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {/* Header + progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <Link href="/learn" className="hover:underline">
            ← My training
          </Link>
          <span>
            {pages[index].label ?? `Page ${index + 1}`} · {index + 1} of {total}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {loading && (
        <div className="rounded-xl border p-6 text-sm text-muted-foreground">
          Loading…
        </div>
      )}

      {/* h5p-standalone mounts the current page here. */}
      <div ref={containerRef} className="h5p-mount" />

      {/* Answer-required hint */}
      {gated && !loading && (
        <p className="text-center text-sm font-medium text-amber-600">
          Answer the question{requiredQuestions > 1 ? "s" : ""} on this page to
          continue ({answeredCount}/{requiredQuestions} answered).
        </p>
      )}

      {/* Navigation + save */}
      <div className="flex items-center justify-between gap-3 border-t pt-4">
        <Button variant="outline" onClick={() => goTo(index - 1)} disabled={index === 0}>
          Back
        </Button>
        <Button variant="ghost" onClick={saveAndExit}>
          Save &amp; come back later
        </Button>
        <Button onClick={next} disabled={gated}>
          {index < total - 1 ? "Next" : "Finish"}
        </Button>
      </div>
    </div>
  );
}
