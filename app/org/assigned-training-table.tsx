import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isOverdue, isAssessmentDue } from "@/lib/engine-logic";
import { isLateCompletion } from "@/lib/org-learners";

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

interface Row {
  userId: string;
  learner: string;
  course: string;
  status: string;
  progress: number;
  /** Certificate issue date = the completion date; enrolments have none. */
  completedAt: string | null;
  assignedAt: string | null;
  dueDate: string | null;
  overdue: boolean;
  late: boolean;
}

function fmtDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  completed: { label: "Completed", cls: "bg-green-100 text-green-700" },
  in_progress: { label: "In progress", cls: "bg-amber-100 text-amber-700" },
  assessment_due: { label: "Assessment due", cls: "bg-indigo-100 text-indigo-700" },
  not_started: { label: "Not started", cls: "bg-slate-100 text-slate-700" },
  expired: { label: "Expired", cls: "bg-rose-100 text-rose-700" },
};

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
  const [{ data: enrolments }, { data: certs }] = await Promise.all([
    supabase
      .from("enrolments")
      .select(
        "user_id, course_id, status, progress, due_date, assigned_at, courses(title), users(full_name, email, role)",
      ),
    supabase.from("certificates").select("user_id, course_id, issued_at"),
  ]);

  // Latest certificate per user+course decides "completed late".
  const certIssued = new Map<string, string>();
  for (const c of certs ?? []) {
    const key = `${c.user_id}:${c.course_id}`;
    const prev = certIssued.get(key);
    if (!prev || c.issued_at > prev) certIssued.set(key, c.issued_at);
  }

  const now = new Date();
  const rows: Row[] = (enrolments ?? [])
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

      <div className="overflow-x-auto rounded-2xl border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="px-3 py-2 font-medium">Learner</th>
              <th className="px-3 py-2 font-medium">Course</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Progress</th>
              <th className="px-3 py-2 font-medium">Assigned</th>
              <th className="px-3 py-2 font-medium">Due</th>
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">
                  Nothing here.
                </td>
              </tr>
            ) : (
              shown.map((r, i) => {
                const key = isAssessmentDue(r.status, r.progress)
                  ? "assessment_due"
                  : r.status;
                const badge = STATUS_BADGE[key] ?? {
                  label: r.status,
                  cls: "bg-slate-100 text-slate-700",
                };
                return (
                  <tr
                    key={`${r.userId}-${r.course}-${i}`}
                    className="border-b last:border-0 hover:bg-accent/40"
                  >
                    <td className="px-3 py-2">
                      <Link
                        href={`/org/staff/${r.userId}`}
                        className="font-medium hover:underline"
                      >
                        {r.learner}
                      </Link>
                    </td>
                    <td className="px-3 py-2">{r.course}</td>
                    <td className="px-3 py-2">
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${badge.cls}`}
                        >
                          {badge.label}
                        </span>
                        {r.overdue && r.status !== "completed" && (
                          <span className="inline-flex rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700">
                            Overdue
                          </span>
                        )}
                        {r.late && (
                          <span className="inline-flex rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                            Late
                          </span>
                        )}
                      </span>
                      {/* When it was finished, next to the status (issue #23). */}
                      {r.completedAt && (
                        <span className="block whitespace-nowrap text-xs text-muted-foreground">
                          {fmtDate(r.completedAt)}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {r.status === "completed" ? "100%" : `${r.progress}%`}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                      {fmtDate(r.assignedAt)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span
                        className={
                          r.overdue
                            ? "font-medium text-rose-600"
                            : "text-muted-foreground"
                        }
                      >
                        {fmtDate(r.dueDate)}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
