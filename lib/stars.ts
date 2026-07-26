import { QUIZ_TARGET } from "@/lib/quiz";

/**
 * Star bank — pure math for the ASSESSMENT half of the star total.
 *
 * A learner earns 1 star per correct assessment answer. Within a single
 * compliance cycle a course is worth its BEST attempt, capped at 20, never
 * additive across retakes in that cycle: fail with 10 then retake with 18 → 18
 * (a +8 gain), never 28, never > 20.
 *
 * Compliance renews: when a certificate EXPIRES and the course must be completed
 * again, that starts a fresh cycle worth its own pool of up to 20 stars. Cycles
 * are bounded by the course's certificate expiry dates — an attempt belongs to
 * the cycle it falls in, and the total is the sum of each cycle's best. So a
 * learner keeps the stars from past cycles AND can earn more on renewal.
 *
 * Correct-count is not stored on quiz_attempts (only the `score` percentage and
 * the `question_ids` array), so we recover it as round(score/100 × count),
 * exact for 20-question attempts. In-content H5P stars are counted separately.
 */

/** Max stars a single course's assessment can contribute per cycle. */
export const STARS_PER_COURSE = QUIZ_TARGET;

export interface StarAttempt {
  course_id: string;
  score: number | null;
  question_ids: unknown;
  submitted_at?: string | null;
}

export interface StarCertificate {
  course_id: string;
  expires_at: string | null;
}

/** Recover the number of correct answers from a stored attempt. */
export function correctFromAttempt(a: StarAttempt): number {
  const total = Array.isArray(a.question_ids) ? a.question_ids.length : 0;
  if (total <= 0) return 0;
  return Math.round(((a.score ?? 0) / 100) * total);
}

/**
 * Stars a course's attempts are worth, summed across compliance cycles. Cycle
 * boundaries are the course's certificate expiry timestamps (ms). An attempt
 * belongs to the cycle whose window contains its submitted_at; each cycle
 * contributes its best (capped). With no boundaries there is a single cycle, so
 * this reduces to best-per-course.
 */
export function starsForCourseCycles(
  attempts: StarAttempt[],
  boundariesMs: number[],
): number {
  const bounds = [...boundariesMs].sort((a, b) => a - b);
  const cycleBest = new Map<number, number>();
  for (const a of attempts) {
    const t = a.submitted_at ? Date.parse(a.submitted_at) : 0;
    // Cycle index = how many expiry boundaries fall before this attempt.
    let idx = 0;
    while (idx < bounds.length && bounds[idx] < t) idx++;
    const prev = cycleBest.get(idx) ?? 0;
    cycleBest.set(idx, Math.min(STARS_PER_COURSE, Math.max(prev, correctFromAttempt(a))));
  }
  let sum = 0;
  for (const v of cycleBest.values()) sum += v;
  return sum;
}

/** Total assessment stars across all courses, summing each course's cycles. */
export function computeStarTotal(
  attempts: StarAttempt[],
  certificates: StarCertificate[] = [],
): number {
  const attemptsByCourse = new Map<string, StarAttempt[]>();
  for (const a of attempts) {
    const list = attemptsByCourse.get(a.course_id) ?? [];
    list.push(a);
    attemptsByCourse.set(a.course_id, list);
  }
  const boundsByCourse = new Map<string, number[]>();
  for (const c of certificates) {
    if (!c.expires_at) continue;
    const list = boundsByCourse.get(c.course_id) ?? [];
    list.push(Date.parse(c.expires_at));
    boundsByCourse.set(c.course_id, list);
  }
  let total = 0;
  for (const [courseId, list] of attemptsByCourse) {
    total += starsForCourseCycles(list, boundsByCourse.get(courseId) ?? []);
  }
  return total;
}

/**
 * Start of the current compliance cycle for a course: the most recent
 * certificate expiry that is already in the past, or -Infinity if none has
 * expired yet (still the first cycle). Used to work out how many stars a new
 * attempt banks — retaking while a certificate is still valid earns nothing new,
 * but retaking after it expires starts a fresh pool.
 */
export function currentCycleStartMs(boundariesMs: number[], nowMs: number): number {
  let start = -Infinity;
  for (const b of boundariesMs) if (b < nowMs && b > start) start = b;
  return start;
}

/** Best (capped) star count among attempts submitted after `sinceMs`. */
export function bestStarsSince(attempts: StarAttempt[], sinceMs: number): number {
  let best = 0;
  for (const a of attempts) {
    const t = a.submitted_at ? Date.parse(a.submitted_at) : 0;
    if (t > sinceMs) best = Math.max(best, correctFromAttempt(a));
  }
  return Math.min(STARS_PER_COURSE, best);
}
