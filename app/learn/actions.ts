"use server";

import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export interface SaveProgressInput {
  enrolmentId: string;
  currentBlock: number;
  progress: number;
  timeSpentDelta: number;
}

/**
 * Persist a learner's position, progress and time spent for one course.
 * RLS guarantees a learner can only update their own enrolment.
 */
export async function saveProgressAction(
  input: SaveProgressInput,
): Promise<{ ok: boolean }> {
  await requireRole("learner");
  const supabase = await createClient();

  const { data: enrolment } = await supabase
    .from("enrolments")
    .select("time_spent, progress, status")
    .eq("id", input.enrolmentId)
    .single();
  if (!enrolment) return { ok: false };

  const newProgress = Math.min(
    100,
    Math.max(enrolment.progress ?? 0, input.progress),
  );
  const status =
    enrolment.status === "completed"
      ? "completed"
      : newProgress > 0
        ? "in_progress"
        : enrolment.status;

  const { error } = await supabase
    .from("enrolments")
    .update({
      current_block: Math.max(0, input.currentBlock),
      progress: newProgress,
      time_spent: (enrolment.time_spent ?? 0) + Math.max(0, input.timeSpentDelta),
      status,
    })
    .eq("id", input.enrolmentId);

  return { ok: !error };
}
