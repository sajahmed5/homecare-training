"use client";

import { useActionState, useEffect, useRef } from "react";
import { Trash2 } from "lucide-react";
import { deleteStaffAction } from "./actions";
import type { SaveState } from "@/app/platform/actions";

/**
 * Permanently removes a staff member (issue #14). Confirms first — the delete
 * also removes their training history and certificates, so it's spelt out.
 */
export function DeleteStaffButton({
  userId,
  name,
}: {
  userId: string;
  name: string;
}) {
  const [state, formAction, pending] = useActionState(
    deleteStaffAction,
    {} as SaveState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.error) window.alert(state.error);
  }, [state]);

  function onSubmit(e: React.FormEvent) {
    if (
      !window.confirm(
        `Delete ${name}? This permanently removes their account, training history and certificates. This cannot be undone.`,
      )
    ) {
      e.preventDefault();
    }
  }

  return (
    <form ref={formRef} action={formAction} onSubmit={onSubmit} className="inline">
      <input type="hidden" name="userId" value={userId} />
      <button
        type="submit"
        disabled={pending}
        title={`Delete ${name}`}
        className="inline-flex items-center gap-1 rounded-full border border-destructive/40 px-2.5 py-1 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
      >
        <Trash2 className="size-3.5" />
        {pending ? "Deleting…" : "Delete"}
      </button>
    </form>
  );
}
