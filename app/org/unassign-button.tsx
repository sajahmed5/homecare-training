"use client";

import { useActionState, useEffect } from "react";
import { CircleMinus } from "lucide-react";
import { unassignTrainingAction } from "./actions";
import type { SaveState } from "@/app/platform/actions";

/**
 * Take a course back off a learner (issue #36). Only rendered while the
 * enrolment is not started or in progress — completed training is a record,
 * not an assignment. Confirms first: this deletes their progress on it.
 */
export function UnassignButton({
  userId,
  courseId,
  course,
  learner,
  inProgress,
}: {
  userId: string;
  courseId: string;
  course: string;
  learner: string;
  /** Warn harder when there is progress to lose. */
  inProgress: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    unassignTrainingAction,
    {} as SaveState,
  );

  useEffect(() => {
    if (state.error) window.alert(state.error);
  }, [state]);

  return (
    <form
      action={formAction}
      className="inline"
      onSubmit={(e) => {
        if (
          !window.confirm(
            inProgress
              ? `Remove ${course} from ${learner}? They have already started it, and their progress will be deleted.`
              : `Remove ${course} from ${learner}?`,
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="courseId" value={courseId} />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-11 items-center gap-1 rounded-full border border-destructive/40 px-2.5 py-1 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50 sm:min-h-0"
      >
        <CircleMinus className="size-3.5" />
        {pending ? "Removing…" : "Unassign"}
      </button>
    </form>
  );
}
