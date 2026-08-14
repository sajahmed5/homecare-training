"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { sendMyPasswordResetAction } from "./actions";

/** The signed-in admin's own details; password stays hidden — reset by email. */
export function AccountDetails({
  fullName,
  email,
}: {
  fullName: string | null;
  email: string | null;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function reset() {
    setBusy(true);
    const res = await sendMyPasswordResetAction();
    setBusy(false);
    setMessage(
      res.ok
        ? "Password reset email sent — check your inbox."
        : (res.error ?? "Could not send the reset email."),
    );
  }

  return (
    <dl className="space-y-3 text-sm">
      <div className="flex items-center justify-between gap-4">
        <dt className="text-muted-foreground">Full name</dt>
        <dd className="font-medium">{fullName ?? "—"}</dd>
      </div>
      <div className="flex items-center justify-between gap-4">
        <dt className="text-muted-foreground">Email (username)</dt>
        <dd className="font-medium">{email ?? "—"}</dd>
      </div>
      <div className="flex items-center justify-between gap-4">
        <dt className="text-muted-foreground">Password</dt>
        <dd className="flex items-center gap-3">
          <span className="font-medium tracking-widest">••••••••••</span>
          <Button size="sm" variant="outline" onClick={reset} disabled={busy}>
            {busy ? "Sending…" : "Reset by email"}
          </Button>
        </dd>
      </div>
      {message && <p className="text-xs text-muted-foreground">{message}</p>}
    </dl>
  );
}
