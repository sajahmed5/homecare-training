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

/** Render a learner's submitted answer as display text (for the pass review). */
export function learnerAnswerText(q: StoredQuestion, answer: unknown): string {
  const opts = q.options ?? [];
  switch (q.type) {
    case "mcq":
    case "true_false":
      return typeof answer === "number" && opts[answer] != null
        ? opts[answer]
        : "No answer";
    case "multi": {
      const picked = Array.isArray(answer)
        ? answer.map(Number).filter((n) => opts[n] != null).map((n) => opts[n])
        : [];
      return picked.length ? picked.join(", ") : "No answer";
    }
    case "fill_blank": {
      const given = Array.isArray(answer)
        ? (answer as unknown[]).map((s) => String(s ?? "").trim()).filter(Boolean)
        : [];
      return given.length ? given.join(", ") : "No answer";
    }
    case "hotspot": {
      const zones = q.payload?.zones ?? [];
      const picked = Array.isArray(answer)
        ? answer
            .map(Number)
            .map((id) => zones.find((z) => z.id === id)?.label)
            .filter(Boolean)
        : [];
      return picked.length ? picked.join(", ") : "No answer";
    }
  }
}

/** Render the correct answer as display text (only ever shown after a pass). */
export function correctAnswerText(q: StoredQuestion): string {
  const opts = q.options ?? [];
  switch (q.type) {
    case "mcq":
    case "true_false":
      return q.answer_index != null && opts[q.answer_index] != null
        ? opts[q.answer_index]
        : "";
    case "multi":
      return (q.payload?.correctIndices ?? [])
        .map((i) => opts[i])
        .filter(Boolean)
        .join(", ");
    case "fill_blank":
      return (q.payload?.blanks ?? [])
        .map((b) => (b.answers ?? [])[0])
        .filter(Boolean)
        .join(", ");
    case "hotspot":
      return (q.payload?.zones ?? [])
        .filter((z) => z.correct)
        .map((z) => z.label)
        .filter(Boolean)
        .join(", ");
  }
}

/**
 * One line of the post-assessment review. `your`/`answer` are populated ONLY on
 * a pass — a failed attempt must never reveal the answer key (the learner is
 * pointed back to the course content instead).
 */
export interface ReviewItem {
  question: string;
  correct: boolean;
  your?: string;
  answer?: string;
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
