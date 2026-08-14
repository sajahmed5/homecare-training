/** Pure helpers for assigning training (form + bulk CSV). */

/**
 * Every assignment must carry a due date (design doc v2); the default is the
 * last day of the current month.
 */
export function endOfMonthISO(now = new Date()): string {
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0));
  return d.toISOString().slice(0, 10);
}

/** Split one CSV line respecting quoted fields. */
function splitLine(line: string, delim: string): string[] {
  const cells: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delim) {
      cells.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  cells.push(cur.trim());
  return cells;
}

/** Accepts YYYY-MM-DD or UK DD/MM/YYYY; returns ISO date or null if invalid. */
export function normaliseDate(value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const uk = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (uk) {
    const [, d, m, y] = uk;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return null;
}

export interface AssignCsvRow {
  email: string;
  course: string;
  dueDate: string | null; // ISO, or null = use the default
  problem?: string; // set when the row can't be imported as-is
}

const HEADER_ALIASES: Record<"email" | "course" | "due", string[]> = {
  email: ["email", "email address", "e-mail", "staff email"],
  course: ["course", "course title", "course name", "training"],
  due: ["due date", "due", "deadline"],
};

/**
 * Parse a bulk-assignment CSV: one row per email × course, optional due date.
 * Handles quoted fields, semicolon delimiters, a BOM, and common header names.
 */
export function parseAssignCsv(text: string): {
  rows: AssignCsvRow[];
  problem?: string;
} {
  const clean = text.replace(/^﻿/, "");
  const lines = clean
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return { rows: [], problem: "The file is empty." };

  const delim =
    lines[0].split(";").length > lines[0].split(",").length ? ";" : ",";
  const first = splitLine(lines[0], delim).map((c) => c.toLowerCase());
  const idx = {
    email: first.findIndex((c) => HEADER_ALIASES.email.includes(c)),
    course: first.findIndex((c) => HEADER_ALIASES.course.includes(c)),
    due: first.findIndex((c) => HEADER_ALIASES.due.includes(c)),
  };
  const hasHeader = idx.email >= 0 || idx.course >= 0;
  if (!hasHeader) {
    // Headerless: assume email,course,due
    idx.email = 0;
    idx.course = 1;
    idx.due = 2;
  } else if (idx.email < 0 || idx.course < 0) {
    return {
      rows: [],
      problem: "Couldn't find the columns. Use headers: email, course, due date.",
    };
  }

  const rows: AssignCsvRow[] = [];
  for (let i = hasHeader ? 1 : 0; i < lines.length; i++) {
    const cells = splitLine(lines[i], delim);
    const email = (cells[idx.email] ?? "").toLowerCase();
    const course = cells[idx.course] ?? "";
    if (!email && !course) continue;
    const rawDue = idx.due >= 0 ? (cells[idx.due] ?? "") : "";
    const dueDate = normaliseDate(rawDue);
    const problem = !email
      ? "Missing email"
      : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        ? "Not a valid email address"
        : !course
          ? "Missing course"
          : rawDue.trim() && !dueDate
            ? `Unrecognised date "${rawDue}"`
            : undefined;
    rows.push({ email, course, dueDate, problem });
  }
  if (rows.length === 0) {
    return { rows: [], problem: "No assignment rows were found." };
  }
  return { rows };
}
