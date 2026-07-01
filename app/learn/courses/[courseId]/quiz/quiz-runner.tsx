"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PASS_PERCENT, type QuizQuestion } from "@/lib/quiz";
import {
  startQuizAction,
  submitQuizAction,
  getCertificateUrlAction,
  type SubmitQuizResult,
} from "@/app/learn/quiz-actions";

type Phase = "intro" | "running" | "result";

export function QuizRunner({
  courseId,
  courseTitle,
}: {
  courseId: string;
  courseTitle: string;
}) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<SubmitQuizResult | null>(null);

  async function start() {
    setBusy(true);
    setError(null);
    const res = await startQuizAction(courseId);
    setBusy(false);
    if (!res.ok || !res.questions) {
      setError(res.error ?? "Could not start.");
      return;
    }
    setAttemptId(res.attemptId!);
    setQuestions(res.questions);
    setAnswers({});
    setPhase("running");
  }

  async function submit() {
    if (!attemptId) return;
    setBusy(true);
    setError(null);
    const res = await submitQuizAction(attemptId, answers);
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "Could not submit.");
      return;
    }
    setResult(res);
    setPhase("result");
  }

  async function download() {
    if (!result?.certificateId) return;
    const { url } = await getCertificateUrlAction(result.certificateId);
    if (url) window.open(url, "_blank");
  }

  const allAnswered =
    questions.length > 0 &&
    questions.every((q) => answers[q.id] !== undefined);

  if (phase === "intro") {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <h2 className="text-2xl font-semibold">Assessment</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Questions are chosen at random from the course question bank.</li>
          <li>You need {PASS_PERCENT}% to pass.</li>
          <li>
            <strong>You must finish in one sitting</strong> — you can&apos;t leave
            and resume a part-done assessment.
          </li>
          <li>Unlimited retakes if you don&apos;t pass.</li>
        </ul>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex gap-3">
          <Button onClick={start} disabled={busy}>
            {busy ? "Starting…" : "Start assessment"}
          </Button>
          <Link href="/learn" className="text-sm text-muted-foreground hover:underline self-center">
            Back to my training
          </Link>
        </div>
      </div>
    );
  }

  if (phase === "running") {
    return (
      <div className="mx-auto max-w-2xl space-y-8">
        <h2 className="text-xl font-semibold">{courseTitle} — assessment</h2>
        {questions.map((q, qi) => (
          <div key={q.id} className="space-y-3">
            <p className="font-medium">
              {qi + 1}. {q.question}
            </p>
            <div className="space-y-2">
              {q.options.map((opt, oi) => (
                <label
                  key={oi}
                  className="flex items-center gap-3 rounded-lg border px-4 py-2.5 text-sm cursor-pointer hover:bg-muted"
                >
                  <input
                    type="radio"
                    name={q.id}
                    checked={answers[q.id] === oi}
                    onChange={() =>
                      setAnswers((prev) => ({ ...prev, [q.id]: oi }))
                    }
                  />
                  {opt}
                </label>
              ))}
            </div>
          </div>
        ))}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button onClick={submit} disabled={busy || !allAnswered}>
          {busy ? "Submitting…" : "Submit assessment"}
        </Button>
      </div>
    );
  }

  // result
  return (
    <div className="mx-auto max-w-2xl space-y-6 text-center">
      <h2 className="text-2xl font-semibold">
        {result?.passed ? "Passed 🎉" : "Not passed"}
      </h2>
      <p className="text-lg">
        You scored <strong>{result?.score}%</strong> ({result?.correct}/
        {result?.total} correct). Pass mark is {PASS_PERCENT}%.
      </p>
      {result?.passed ? (
        <div className="space-y-3">
          <p className="text-muted-foreground">
            A certificate has been issued. Your newest certificate is the live
            one for compliance.
          </p>
          <div className="flex justify-center gap-3">
            {result.certificateId && (
              <Button onClick={download}>Download certificate</Button>
            )}
            <Link
              href="/learn"
              className="text-sm text-muted-foreground hover:underline self-center"
            >
              Back to my training
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex justify-center gap-3">
          <Button
            onClick={() => {
              setResult(null);
              setPhase("intro");
            }}
          >
            Retake assessment
          </Button>
          <Link
            href="/learn"
            className="text-sm text-muted-foreground hover:underline self-center"
          >
            Back to my training
          </Link>
        </div>
      )}
    </div>
  );
}
