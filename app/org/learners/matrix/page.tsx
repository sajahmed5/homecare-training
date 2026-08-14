import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { loadOrgLearners } from "@/lib/org-learners";
import { LearnersTable, type Filter } from "../learners-table";
import { LearnersTabs } from "../learners-tabs";
import { RemindersTable, type ReminderRow } from "../reminders-table";
import { MatrixExport } from "../../matrix-export";

const FILTERS: Filter[] = [
  "all",
  "overdue",
  "in_progress",
  "not_started",
  "completed",
  "unassigned",
  "deactivated",
  "inactive",
  "never",
];

/** Stats & matrix: every learner (including deactivated) with full stats. */
export default async function LearnersMatrixPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  await requireRole("org_admin");
  const { filter } = await searchParams;
  const initialFilter: Filter = FILTERS.includes(filter as Filter)
    ? (filter as Filter)
    : "all";

  const supabase = await createClient();
  const [rows, { data: organisation }, { data: nudgeLog }] = await Promise.all([
    loadOrgLearners(supabase),
    supabase.from("organisations").select("name").single(),
    supabase
      .from("email_log")
      .select("id, to_email, subject, sent, created_at")
      .eq("type", "org_nudge")
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  const nameByEmail = new Map<string, string>();
  for (const r of rows) if (r.email) nameByEmail.set(r.email.toLowerCase(), r.name);
  const reminders: ReminderRow[] = (nudgeLog ?? []).map((l) => ({
    id: l.id,
    toEmail: l.to_email,
    learnerName: nameByEmail.get(l.to_email.toLowerCase()) ?? null,
    subject: l.subject,
    sent: l.sent,
    createdAt: l.created_at,
  }));

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <MatrixExport
          filename={`${organisation?.name ?? "org"}-training-matrix.csv`}
        />
      </div>
      <LearnersTabs
        reminderCount={reminders.length}
        learners={
          <LearnersTable
            rows={rows}
            initialFilter={initialFilter}
            filename={`${organisation?.name ?? "org"}-learners.csv`}
          />
        }
        reminders={<RemindersTable rows={reminders} />}
      />
    </div>
  );
}
