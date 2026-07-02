"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Confetti } from "@/components/confetti";
import { PASS_PERCENT, type PublicQuestion } from "@/lib/quiz";
import {
  startQuizAction,
  submitQuizAction,
  getCertificateUrlAction,
  type SubmitQuizResult,
} from "@/app/learn/quiz-actions";

type Phase = "intro" | "running" | "result";
type AnswerMap = Record<string, unknown>;

/** True when a question has an answer suitable to submit. */
function isAnswered(q: PublicQuestion, a: unknown): boolean {
  switch (q.type) {
    case "mcq":
    case "true_false":
      return typeof a === "number";
    case "multi":
    case "hotspot":
      return Array.isArray(a) && a.length > 0;
    case "fill_blank":
      return Array.isArray(a) && a.length === q.blanks && a.every((s) => String(s ?? "").trim() !== "");
  }
}

const TYPE_HINT: Record<PublicQuestion["type"], string> = {
  mcq: "Choose one answer",
  true_false: "True or false?",
  multi: "Select all that apply",
  fill_blank: "Type the missing word(s)",
  hotspot: "Click all that apply on the image",
};

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
  const [questions, setQuestions] = useState<PublicQuestion[]>([]);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [result, setResult] = useState<SubmitQuizResult | null>(null);

  const setAnswer = (id: string, value: unknown) =>
    setAnswers((prev) => ({ ...prev, [id]: value }));

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
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  }

  async function download() {
    if (!result?.certificateId) return;
    const { url } = await getCertificateUrlAction(result.certificateId);
    if (url) window.open(url, "_blank");
  }

  const answeredCount = questions.filter((q) => isAnswered(q, answers[q.id])).length;
  const allAnswered = questions.length > 0 && answeredCount === questions.length;

  if (phase === "intro") {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <h2 className="text-2xl font-semibold">Assessment</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Questions are chosen at random from the course question bank.</li>
          <li>A mix of question types — multiple choice, select-all, true/false, fill the gap and click-the-image.</li>
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
          <Link href="/learn" className="self-center text-sm text-muted-foreground hover:underline">
            Back to my training
          </Link>
        </div>
      </div>
    );
  }

  if (phase === "running") {
    return (
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="sticky top-0 z-10 -mx-2 bg-background/90 px-2 py-2 backdrop-blur">
          <h2 className="text-xl font-semibold">{courseTitle} — assessment</h2>
          <p className="text-sm text-muted-foreground">{answeredCount} of {questions.length} answered</p>
        </div>
        {questions.map((q, qi) => (
          <div key={q.id} className="space-y-3 rounded-xl border p-4">
            <div>
              <p className="font-medium">{qi + 1}. {q.type === "fill_blank" ? "Complete the sentence" : q.question}</p>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{TYPE_HINT[q.type]}</p>
            </div>
            <QuestionInput q={q} value={answers[q.id]} onChange={(v) => setAnswer(q.id, v)} />
          </div>
        ))}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="sticky bottom-0 -mx-2 bg-background/90 px-2 py-3 backdrop-blur">
          <Button onClick={submit} disabled={busy || !allAnswered} className="w-full sm:w-auto">
            {busy ? "Submitting…" : allAnswered ? "Submit assessment" : `Answer all questions (${answeredCount}/${questions.length})`}
          </Button>
        </div>
      </div>
    );
  }

  // result
  return (
    <div className="mx-auto max-w-2xl space-y-6 text-center">
      {result?.passed && <Confetti />}
      <h2 className="text-2xl font-semibold">{result?.passed ? "Passed 🎉" : "Not passed"}</h2>
      <p className="text-lg">
        You scored <strong>{result?.score}%</strong> ({result?.correct}/{result?.total} correct). Pass mark is {PASS_PERCENT}%.
      </p>
      {result?.passed ? (
        <div className="space-y-3">
          <p className="text-muted-foreground">
            A certificate has been issued. Your newest certificate is the live one for compliance.
          </p>
          <div className="flex justify-center gap-3">
            {result.certificateId && <Button onClick={download}>Download certificate</Button>}
            <Link href="/learn" className="self-center text-sm text-muted-foreground hover:underline">Back to my training</Link>
          </div>
        </div>
      ) : (
        <div className="flex justify-center gap-3">
          <Button onClick={() => { setResult(null); setPhase("intro"); }}>Retake assessment</Button>
          <Link href="/learn" className="self-center text-sm text-muted-foreground hover:underline">Back to my training</Link>
        </div>
      )}
    </div>
  );
}

/** Renders the appropriate input for each question type. */
function QuestionInput({
  q,
  value,
  onChange,
}: {
  q: PublicQuestion;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  switch (q.type) {
    case "mcq":
    case "true_false":
      return (
        <div className="space-y-2">
          {q.options.map((opt, oi) => (
            <label key={oi} className="flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-2.5 text-sm hover:bg-muted">
              <input type="radio" name={q.id} checked={value === oi} onChange={() => onChange(oi)} />
              {opt}
            </label>
          ))}
        </div>
      );

    case "multi": {
      const arr = Array.isArray(value) ? (value as number[]) : [];
      const toggle = (oi: number) =>
        onChange(arr.includes(oi) ? arr.filter((n) => n !== oi) : [...arr, oi]);
      return (
        <div className="space-y-2">
          {q.options.map((opt, oi) => (
            <label key={oi} className="flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-2.5 text-sm hover:bg-muted">
              <input type="checkbox" checked={arr.includes(oi)} onChange={() => toggle(oi)} />
              {opt}
            </label>
          ))}
        </div>
      );
    }

    case "fill_blank": {
      const parts = q.question.split(/_{2,}/);
      const arr = Array.isArray(value) ? (value as string[]) : [];
      const blanks = q.blanks;
      const setBlank = (i: number, v: string) => {
        const next = [...arr];
        while (next.length < blanks) next.push("");
        next[i] = v;
        onChange(next);
      };
      return (
        <p className="text-sm leading-8">
          {parts.map((part, i) => (
            <span key={i}>
              {part}
              {i < parts.length - 1 && (
                <input
                  type="text"
                  value={arr[i] ?? ""}
                  onChange={(e) => setBlank(i, e.target.value)}
                  className="mx-1 w-32 rounded-md border-b-2 border-primary bg-muted/40 px-2 py-1 text-sm outline-none focus:bg-muted"
                  aria-label={`Blank ${i + 1}`}
                />
              )}
            </span>
          ))}
        </p>
      );
    }

    case "hotspot": {
      const arr = Array.isArray(value) ? (value as number[]) : [];
      const toggle = (id: number) =>
        onChange(arr.includes(id) ? arr.filter((n) => n !== id) : [...arr, id]);
      return (
        <div className="space-y-2">
          <div className="relative w-full overflow-hidden rounded-lg border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={q.image} alt="" className="block w-full select-none" draggable={false} />
            {q.zones.map((z) => {
              const selected = arr.includes(z.id);
              return (
                <button
                  key={z.id}
                  type="button"
                  onClick={() => toggle(z.id)}
                  title={z.label}
                  className={`absolute rounded-md border-2 transition-colors ${
                    selected ? "border-primary bg-primary/30" : "border-transparent hover:border-primary/60 hover:bg-primary/10"
                  }`}
                  style={{ left: `${z.x}%`, top: `${z.y}%`, width: `${z.w}%`, height: `${z.h}%` }}
                  aria-label={z.label ?? `Area ${z.id}`}
                />
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">Tap each spot you think applies. Tap again to deselect.</p>
        </div>
      );
    }
  }
}
