import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { fetchAll } from "@/lib/fetch-all";
import { isOverdue } from "@/lib/engine-logic";
import { isLateCompletion } from "@/lib/org-learners";
import { AssignedTrainingRows, type TrainingRow } from "./assigned-training-rows";

export type TrainingStatusFilter =
  | "all"
  | "completed"
  | "in_progress"
  | "not_started"
  | "overdue"
  | "late";

export const TRAINING_TABS: { key: TrainingStatusFilter; label: string }[] = [
  { key: "all", label: "All assigned" },
  { key: "completed", label: "Completed" },
  { key: "in_progress", label: "In progress" },
  { key: "not_started", label: "Not started" },
  { key: "overdue", label: "Overdue" },
  { key: "late", label: "Completed late" },
];


/**
 * Every assignment in the org (one row per learner × course), filterable to
 * the set behind each overview tile. "Overdue" and "Completed late" cut
 * across the plain statuses, matching how the tiles count them. Server
 * component — tabs are links carrying ?status= on `baseHref`.
 */
export async function AssignedTrainingTable({
  status = "all",
  baseHref,
}: {
  status?: TrainingStatusFilter;
  baseHref: string;
}) {
  const supabase = await createClient();
  // Paged — Supabase silently returns at most 1,000 rows.
  const [enrolments, certs] = await Promise.all([
    fetchAll((f, t) =>
      supabase
        .from("enrolments")
        .select(
          "id, user_id, course_id, status, progress, due_date, assigned_at, courses(title), users(full_name, email, role)",
        )
        .order("id")
        .range(f, t),
    ),
    fetchAll((f, t) =>
      supabase.from("certificates").select("id, user_id, course_id, issued_at").order("id").range(f, t),
    ),
  ]);

  // Latest certificate per user+course decides "completed late".
  const certIssued = new Map<string, string>();
  for (const c of certs ?? []) {
    const key = `${c.user_id}:${c.course_id}`;
    const prev = certIssued.get(key);
    if (!prev || c.issued_at > prev) certIssued.set(key, c.issued_at);
  }

  const now = new Date();
  const rows: TrainingRow[] = (enrolments ?? [])
    .map((e) => {
      const u = e.users as unknown as {
        full_name?: string;
        email?: string;
        role?: string;
      } | null;
      const c = e.courses as unknown as { title?: string } | null;
      const issuedAt = certIssued.get(`${e.user_id}:${e.course_id}`);
      return {
        userId: e.user_id as string,
        learner: u?.full_name || u?.email || "Learner",
        course: c?.title ?? "Course",
        status: e.status as string,
        progress: e.progress ?? 0,
        assignedAt: e.assigned_at,
        dueDate: e.due_date,
        overdue: isOverdue(e.due_date, e.status, now),
        completedAt: e.status === "completed" ? (issuedAt ?? null) : null,
        late:
          e.status === "completed" &&
          !!issuedAt &&
          isLateCompletion(issuedAt, e.due_date),
      };
    })
    .sort(
      (a, b) =>
        a.learner.localeCompare(b.learner) || a.course.localeCompare(b.course),
    );

  const matching = (f: TrainingStatusFilter) =>
    f === "all"
      ? rows
      : f === "overdue"
        ? rows.filter((r) => r.overdue)
        : f === "late"
          ? rows.filter((r) => r.late)
          : rows.filter((r) => r.status === f);
  const shown = matching(status);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {TRAINING_TABS.map((t) => {
          const active = status === t.key;
          return (
            <Link
              key={t.key}
              href={t.key === "all" ? baseHref : `${baseHref}?status=${t.key}`}
              className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                active
                  ? "border-foreground bg-foreground text-background"
                  : "hover:bg-accent"
              }`}
            >
              {t.label}{" "}
              <span className={active ? "opacity-80" : "text-muted-foreground"}>
                {matching(t.key).length}
              </span>
            </Link>
          );
        })}
      </div>

      <AssignedTrainingRows rows={shown} />
    </div>
  );
}
