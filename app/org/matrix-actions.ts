"use server";

import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export interface MatrixCourse {
  id: string;
  title: string;
  topic: string | null;
}

export interface MatrixRow {
  name: string;
  email: string;
  /** courseId -> "completed → expiry" cell text ("" if not completed). */
  cells: Record<string, string>;
}

export interface TrainingMatrix {
  courses: MatrixCourse[];
  rows: MatrixRow[];
}

interface JoinedCourse {
  title?: string;
  topics?: { title?: string } | null;
}
function pickCourse(row: { courses?: unknown }): JoinedCourse {
  return (row.courses as JoinedCourse) ?? {};
}
function ddmmyyyy(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Build the org's training matrix: every staff member as a row, every course
 * used in the org as a column, each cell showing the completion → expiry dates
 * from the learner's newest certificate for that course. RLS scopes all reads
 * to the caller's own organisation.
 */
export async function exportTrainingMatrixAction(): Promise<TrainingMatrix> {
  await requireRole("org_admin");
  const supabase = await createClient();

  const [{ data: users }, { data: enrolments }, { data: certs }] =
    await Promise.all([
      supabase
        .from("users")
        .select("id, full_name, email")
        .eq("role", "learner")
        .order("full_name", { ascending: true }),
      supabase
        .from("enrolments")
        .select("user_id, course_id, courses(title, topics(title))"),
      supabase
        .from("certificates")
        .select(
          "user_id, course_id, issued_at, expires_at, courses(title, topics(title))",
        )
        .order("issued_at", { ascending: false }),
    ]);

  // Column set = every course the org actually uses (assigned or certified).
  const courseMap = new Map<string, MatrixCourse>();
  const noteCourse = (
    id: string,
    row: { courses?: unknown },
  ) => {
    if (courseMap.has(id)) return;
    const c = pickCourse(row);
    courseMap.set(id, {
      id,
      title: c.title ?? "Course",
      topic: c.topics?.title ?? null,
    });
  };
  for (const e of enrolments ?? []) noteCourse(e.course_id, e);
  for (const c of certs ?? []) noteCourse(c.course_id, c);

  const courses = [...courseMap.values()].sort(
    (a, b) =>
      (a.topic ?? "").localeCompare(b.topic ?? "") ||
      a.title.localeCompare(b.title),
  );

  // Newest certificate per (user, course) — certs are ordered issued_at desc.
  const newestCert = new Map<string, { issued_at: string; expires_at: string | null }>();
  for (const c of certs ?? []) {
    const key = `${c.user_id}:${c.course_id}`;
    if (!newestCert.has(key)) {
      newestCert.set(key, { issued_at: c.issued_at, expires_at: c.expires_at });
    }
  }

  const rows: MatrixRow[] = (users ?? []).map((u) => {
    const cells: Record<string, string> = {};
    for (const course of courses) {
      const cert = newestCert.get(`${u.id}:${course.id}`);
      cells[course.id] = cert
        ? `${ddmmyyyy(cert.issued_at)} → ${cert.expires_at ? ddmmyyyy(cert.expires_at) : "no expiry"}`
        : "";
    }
    return {
      name: u.full_name ?? u.email ?? "",
      email: u.email ?? "",
      cells,
    };
  });

  return { courses, rows };
}
