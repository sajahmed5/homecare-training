/** Target number of questions per quiz (capped at the bank size). */
export const QUIZ_TARGET = 20;

/** Pass mark, as a percentage. */
export const PASS_PERCENT = 80;

/** Question as shown to a learner — never includes the correct answer. */
export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
}

export interface QuizGrade {
  correct: number;
  total: number;
  score: number;
  passed: boolean;
}

/** Pure grading: compares a learner's answers to the answer key. */
export function gradeQuiz(
  questionIds: string[],
  answerKey: Map<string, number>,
  answers: Record<string, number>,
): QuizGrade {
  let correct = 0;
  for (const qid of questionIds) {
    if (answers[qid] === answerKey.get(qid)) correct += 1;
  }
  const total = questionIds.length;
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
