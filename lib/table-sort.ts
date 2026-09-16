/**
 * Click-to-sort for the statistics tables (issue #40). Pure, so the ordering
 * rules can be tested without rendering anything.
 *
 * The rules a manager expects:
 * - Text sorts A–Z on the first click; dates and numbers sort newest or
 *   largest first, since that's usually what they came to see.
 * - A second click reverses it.
 * - Blanks (no due date, nothing tracked yet) always sit at the bottom, in
 *   either direction — otherwise "newest first" opens on a screen of dashes.
 * - Rows that tie keep the order they came in, so the table doesn't shuffle.
 */

export type SortDir = "asc" | "desc";

export interface SortColumn<T> {
  /** Direction of the first click. */
  first: SortDir;
  /** The value compared. Strings compare as text; numbers numerically. */
  value: (row: T) => string | number | null;
  /** Applied to ties, unaffected by direction. */
  tieBreak?: (a: T, b: T) => number;
}

/** A column's settings for plain text: A–Z first. */
export const textColumn = <T>(value: (row: T) => string | null): SortColumn<T> => ({
  first: "asc",
  value,
});

/** Numbers: largest first. */
export const numberColumn = <T>(value: (row: T) => number | null): SortColumn<T> => ({
  first: "desc",
  value,
});

/** Dates (ISO strings or YYYY-MM-DD): newest first. */
export const dateColumn = <T>(value: (row: T) => string | null): SortColumn<T> => ({
  first: "desc",
  value: (row) => {
    const d = value(row);
    if (!d) return null;
    const t = Date.parse(d);
    return Number.isNaN(t) ? null : t;
  },
});

/** Newest first, blanks last — a tie-break for "latest completed on top". */
export function newestFirst<T>(get: (row: T) => string | null) {
  return (a: T, b: T) => {
    const x = get(a);
    const y = get(b);
    if (!x && !y) return 0;
    if (!x) return 1;
    if (!y) return -1;
    return y.localeCompare(x);
  };
}

const collator = new Intl.Collator("en-GB", { sensitivity: "base", numeric: true });

export function sortRows<T>(rows: T[], column: SortColumn<T>, dir: SortDir): T[] {
  const sign = dir === "asc" ? 1 : -1;
  return rows
    .map((row, i) => ({ row, i, v: column.value(row) }))
    .sort((a, b) => {
      const blankA = a.v === null || a.v === "";
      const blankB = b.v === null || b.v === "";
      if (blankA !== blankB) return blankA ? 1 : -1;
      let cmp = 0;
      if (!blankA) {
        cmp =
          typeof a.v === "number" && typeof b.v === "number"
            ? a.v - b.v
            : collator.compare(String(a.v), String(b.v));
      }
      return sign * cmp || column.tieBreak?.(a.row, b.row) || a.i - b.i;
    })
    .map((x) => x.row);
}

/** The next sort state after clicking `key`. */
export function nextSort<K extends string>(
  current: { key: K; dir: SortDir } | null,
  key: K,
  first: SortDir,
): { key: K; dir: SortDir } {
  if (current?.key !== key) return { key, dir: first };
  return { key, dir: current.dir === "asc" ? "desc" : "asc" };
}

/**
 * Training status in order of urgency — what a click on Status sorts by.
 * Overdue first and completed last, so the second click puts completed on
 * top — newest first, via the tie-break (issue #40's "latest completed at the
 * top"). Expired needs retaking, so it sits with the unfinished stages.
 */
export function statusRank(status: string, overdue = false, assessmentDue = false): number {
  if (overdue && status !== "completed") return 0;
  if (assessmentDue) return 1;
  return (
    { in_progress: 2, not_started: 3, expired: 4, completed: 5 } as Record<string, number>
  )[status] ?? 6;
}
