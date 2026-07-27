"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordResetAction, type ResetState } from "./actions";

const initial: ResetState = {};

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(
    requestPasswordResetAction,
    initial,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Sending…" : "Send reset link"}
      </Button>

      {state.message && (
        <p
          role="status"
          className={`text-sm ${state.ok ? "text-muted-foreground" : "text-destructive"}`}
        >
          {state.message}
        </p>
      )}

      {state.link && (
        <p className="break-all rounded-md border bg-muted/40 p-2 text-xs text-muted-foreground">
          Email isn&apos;t configured yet — use this link to reset:{" "}
          <a href={state.link} className="text-primary underline">
            {state.link}
          </a>
        </p>
      )}
    </form>
  );
}
