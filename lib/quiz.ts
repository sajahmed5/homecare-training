/** Target number of questions per quiz (capped at the bank size). */
export const QUIZ_TARGET = 20;

/** Pass mark, as a percentage. */
export const PASS_PERCENT = 80;

export type QuestionType =
  | "mcq"
  | "multi"
  | "true_false"
  | "fill_blank"
  | "hotspot";

/** A clickable region on a hotspot image, as percentages of the image box. */
export interface HotspotZone {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  label?: string;
  correct?: boolean; // present only in the stored (server) question
}

/** Question as stored server-side — INCLUDES the correct answer. Never sent raw. */
export interface StoredQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options: string[] | null;
  answer_index: number | null;
  payload:
    | {
        correctIndices?: number[]; // multi
        blanks?: { answers: string[] }[]; // fill_blank
        image?: string; // hotspot
        zones?: HotspotZone[]; // hotspot
      }
    | null;
}

/** Question as shown to a learner — the correct answer is stripped out. */
export type PublicQuestion =
  | { id: string; type: "mcq" | "true_false"; question: string; options: string[] }
  | { id: string; type: "multi"; question: string; options: string[] }
  | { id: string; type: "fill_blank"; question: string; blanks: number }
  | {
      id: string;
      type: "hotspot";
      question: string;
      image: string;
      zones: Omit<HotspotZone, "correct">[];
    };

/** A learner's answer varies by type: index | indices | typed strings. */
export type Answer = number | number[] | string[];

export interface QuizGrade {
  correct: number;
  total: number;
  score: number;
  passed: boolean;
}

const norm = (s: unknown) => String(s ?? "").trim().toLowerCase();
const sameSet = (a: number[], b: number[]) => {
  const A = new Set(a);
  const B = new Set(b);
  return A.size === B.size && [...A].every((x) => B.has(x));
};

/** Strip the correct answer(s) from a stored question for sending to the learner. */
export function toPublicQuestion(q: StoredQuestion): PublicQuestion {
  switch (q.type) {
    case "mcq":
    case "true_false":
      return { id: q.id, type: q.type, question: q.question, options: q.options ?? [] };
    case "multi":
      return { id: q.id, type: "multi", question: q.question, options: q.options ?? [] };
    case "fill_blank":
      return {
        id: q.id,
        type: "fill_blank",
        question: q.question,
        blanks: q.payload?.blanks?.length ?? (q.question.match(/_{2,}/g)?.length ?? 1),
      };
    case "hotspot":
      return {
        id: q.id,
        type: "hotspot",
        question: q.question,
        image: q.payload?.image ?? "",
        // never leak which zones are the correct ones
        zones: (q.payload?.zones ?? []).map(({ id, x, y, w, h, label }) => ({ id, x, y, w, h, label })),
      };
  }
}

/** Grade a single answer against its stored question. */
export function gradeAnswer(q: StoredQuestion, answer: unknown): boolean {
  switch (q.type) {
    case "mcq":
    case "true_false":
      return typeof answer === "number" && answer === q.answer_index;
    case "multi": {
      const correct = q.payload?.correctIndices ?? [];
      const given = Array.isArray(answer) ? answer.map(Number).filter((n) => !Number.isNaN(n)) : [];
      return correct.length > 0 && sameSet(correct, given);
    }
    case "fill_blank": {
      const blanks = q.payload?.blanks ?? [];
      const given = Array.isArray(answer) ? (answer as unknown[]) : [];
      if (blanks.length === 0 || given.length !== blanks.length) return false;
      return blanks.every((b, i) => (b.answers ?? []).some((acc) => norm(acc) === norm(given[i])));
    }
    case "hotspot": {
      const correct = (q.payload?.zones ?? []).filter((z) => z.correct).map((z) => z.id);
      const given = Array.isArray(answer) ? answer.map(Number).filter((n) => !Number.isNaN(n)) : [];
      return correct.length > 0 && sameSet(correct, given);
    }
  }
}

/** Grade a whole attempt: one point per question, all-or-nothing per question. */
export function gradeQuiz(
  questions: StoredQuestion[],
  answers: Record<string, unknown>,
): QuizGrade {
  let correct = 0;
  for (const q of questions) if (gradeAnswer(q, answers[q.id])) correct += 1;
  const total = questions.length;
  const score = total > 0 ? Math.round((correct / total) * 100) : 0;
  return { correct, total, score, passed: score >= PASS_PERCENT };
}

/** A human-readable, unique-ish certificate number. */
export function makeCertificateNumber(seed: string): string {
  const year = new Date().getFullYear();
  const short = seed.replace(/-/g, "").slice(0, 8).toUpperCase();
  return `MCA-${year}-${short}`;
}

/** expires_at from a completion date + expiry_months (0 => never). */
export function computeExpiry(from: Date, expiryMonths: number): Date | null {
  if (!expiryMonths || expiryMonths <= 0) return null;
  const d = new Date(from);
  d.setMonth(d.getMonth() + expiryMonths);
  return d;
}
