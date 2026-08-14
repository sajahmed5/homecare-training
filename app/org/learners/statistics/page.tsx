import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { loadOrgLearners } from "@/lib/org-learners";
import { LearnersTable, type Filter } from "../learners-table";
import {
  AssignedTrainingTable,
  TRAINING_TABS,
  type TrainingStatusFilter,
} from "../../assigned-training-table";
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

/**
 * Statistics: every learner (including deactivated) with full training stats,
 * plus the assigned-training table (one row per learner × course) below.
 */
export default async function LearnersStatisticsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; status?: string }>;
}) {
  await requireRole("org_admin");
  const { filter, status } = await searchParams;
  const initialFilter: Filter = FILTERS.includes(filter as Filter)
    ? (filter as Filter)
    : "all";
  const trainingStatus: TrainingStatusFilter = TRAINING_TABS.some(
    (t) => t.key === status,
  )
    ? (status as TrainingStatusFilter)
    : "all";

  const supabase = await createClient();
  const [rows, { data: organisation }] = await Promise.all([
    loadOrgLearners(supabase),
    supabase.from("organisations").select("name").single(),
  ]);

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Learners
          </h2>
          <MatrixExport
            filename={`${organisation?.name ?? "org"}-training-matrix.csv`}
          />
        </div>
        <LearnersTable
          rows={rows}
          initialFilter={initialFilter}
          filename={`${organisation?.name ?? "org"}-learners.csv`}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Assigned training
        </h2>
        <AssignedTrainingTable
          status={trainingStatus}
          baseHref="/org/learners/statistics"
        />
      </section>
    </div>
  );
}
