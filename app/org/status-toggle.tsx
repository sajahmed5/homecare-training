"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import type { SaveState } from "@/app/platform/actions";
import { setStaffStatusAction } from "./actions";

export function StatusToggle({
  userId,
  status,
}: {
  userId: string;
  status: string;
}) {
  const [state, formAction, pending] = useActionState(
    setStaffStatusAction,
    {} as SaveState,
  );
  const deactivating = status === "active";

  return (
    <form action={formAction} className="inline-flex items-center gap-2">
      <input type="hidden" name="userId" value={userId} />
      <input
        type="hidden"
        name="status"
        value={deactivating ? "deactivated" : "active"}
      />
      <Button
        type="submit"
        size="xs"
        variant={deactivating ? "destructive" : "outline"}
        disabled={pending}
      >
        {pending ? "…" : deactivating ? "Deactivate" : "Reactivate"}
      </Button>
      {state.error && (
        <span className="text-xs text-destructive">{state.error}</span>
      )}
    </form>
  );
}
