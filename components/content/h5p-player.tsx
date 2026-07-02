"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { saveProgressAction } from "@/app/learn/actions";

// Isolate the impure clock read from the component/hook bodies.
const nowMs = () => Date.now();

// Minimal shape of the global H5P runtime we touch (loaded by h5p-standalone).
interface H5PGlobal {
  externalDispatcher?: {
    on: (event: string, cb: (e: { getVerb?: () => string; data?: unknown }) => void) => void;
  };
}
declare global {
  interface Window {
    H5P?: H5PGlobal;
  }
}

/**
 * Plays a full-module H5P package (e.g. an H5P.Column) with h5p-standalone and
 * bridges H5P's xAPI completion into our enrolment progress.
 */
export function H5PPlayer({
  enrolmentId,
  courseId,
  title,
  path,
}: {
  enrolmentId: string;
  courseId: string;
  title: string;
  path: string;
}) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const startRef = useRef(nowMs());
  const persistedRef = useRef(false);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    let disposed = false;
    const el = containerRef.current;
    if (!el) return;

    function persistComplete() {
      if (persistedRef.current) return;
      persistedRef.current = true;
      const delta = Math.round((nowMs() - startRef.current) / 1000);
      void saveProgressAction({
        enrolmentId,
        currentBlock: 0,
        progress: 100,
        timeSpentDelta: delta,
      });
      setCompleted(true);
    }

    (async () => {
      try {
        const { H5P } = await import("h5p-standalone");
        if (disposed) return;
        await new H5P(el, {
          h5pJsonPath: `/h5p/content/${path}`,
          librariesPath: "/h5p/libraries",
          frameJs: "/h5p/assets/frame.bundle.js",
          frameCss: "/h5p/assets/styles/h5p.css",
        });
        if (disposed) return;
        setStatus("ready");

        // Bridge H5P xAPI → our progress. A "completed" (or "answered" on the
        // root) statement means the learner has worked through the module.
        window.H5P?.externalDispatcher?.on("xAPI", (event) => {
          const verb = event.getVerb?.();
          if (verb === "completed" || verb === "answered") persistComplete();
        });
      } catch (err) {
        console.error("H5P load failed", err);
        if (!disposed) setStatus("error");
      }
    })();

    // Best-effort save of time spent if the learner leaves mid-module.
    const onHide = () => {
      if (document.visibilityState === "hidden" && !persistedRef.current) {
        const delta = Math.round((nowMs() - startRef.current) / 1000);
        void saveProgressAction({
          enrolmentId,
          currentBlock: 0,
          progress: 5,
          timeSpentDelta: delta,
        });
      }
    };
    document.addEventListener("visibilitychange", onHide);

    return () => {
      disposed = true;
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [enrolmentId, path]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <Link href="/learn" className="hover:underline">
          ← My training
        </Link>
        <span>Interactive module</span>
      </div>

      {status === "error" && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-6 text-sm">
          This interactive content couldn&apos;t be loaded. Please refresh the
          page or try again later.
        </div>
      )}

      {status === "loading" && (
        <div className="rounded-xl border p-6 text-sm text-muted-foreground">
          Loading interactive content…
        </div>
      )}

      {/* h5p-standalone mounts the module here. */}
      <div ref={containerRef} className="h5p-mount" />

      <div className="flex flex-col items-center gap-3 border-t pt-6 text-center">
        {completed ? (
          <p className="text-sm font-medium text-emerald-600">
            Nice work — you&apos;ve completed <strong>{title}</strong>. Now take
            the assessment to earn your certificate.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Work through every activity above, then continue to the assessment.
          </p>
        )}
        <div className="flex justify-center gap-3">
          <Button onClick={() => router.push(`/learn/courses/${courseId}/quiz`)}>
            Start assessment
          </Button>
          <Button variant="outline" onClick={() => router.push("/learn")}>
            Back to my training
          </Button>
        </div>
      </div>
    </div>
  );
}
