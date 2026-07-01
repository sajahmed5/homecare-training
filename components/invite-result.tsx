import type { InviteState } from "@/app/platform/actions";

/** Shared success/error/link feedback for invite forms. */
export function InviteResult({ state }: { state: InviteState }) {
  if (state.error) {
    return (
      <p role="alert" className="text-sm text-destructive">
        {state.error}
      </p>
    );
  }

  if (!state.ok) return null;

  if (state.sent) {
    return (
      <p className="text-sm text-green-700 dark:text-green-500">
        Invitation emailed to {state.email}.
      </p>
    );
  }

  // Email not configured — show the copyable invite link.
  return (
    <div className="space-y-1 text-sm">
      <p className="text-muted-foreground">
        Invite created for {state.email}. Email isn&apos;t configured yet, so
        share this link with them:
      </p>
      <code className="block overflow-x-auto rounded bg-muted p-2 text-xs break-all">
        {state.link}
      </code>
    </div>
  );
}
