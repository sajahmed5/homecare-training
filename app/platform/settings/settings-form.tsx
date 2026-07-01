"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  updateSettingsAction,
  type SettingsState,
} from "@/app/platform/settings-actions";

export function SettingsForm({
  threshold,
  windows,
  repeat,
}: {
  threshold: number;
  windows: number[];
  repeat: number;
}) {
  const [state, formAction, pending] = useActionState(
    updateSettingsAction,
    {} as SettingsState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="engagement_threshold">
          Low-engagement alert threshold (%)
        </Label>
        <Input
          id="engagement_threshold"
          name="engagement_threshold"
          type="number"
          min={0}
          max={100}
          defaultValue={threshold}
        />
        <p className="text-xs text-muted-foreground">
          Platform admins are alerted when an org&apos;s completion rate falls
          below this.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="renewal_windows">Renewal reminder windows (days)</Label>
        <Input
          id="renewal_windows"
          name="renewal_windows"
          defaultValue={windows.join(", ")}
        />
        <p className="text-xs text-muted-foreground">
          Comma-separated, e.g. 60, 30, 7.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reminder_repeat">Reminder repeat interval (days)</Label>
        <Input
          id="reminder_repeat"
          name="reminder_repeat"
          type="number"
          min={1}
          defaultValue={repeat}
        />
      </div>

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save settings"}
        </Button>
        {state.error && (
          <span className="text-sm text-destructive">{state.error}</span>
        )}
        {state.ok && (
          <span className="text-sm text-green-700 dark:text-green-500">
            Saved.
          </span>
        )}
      </div>
    </form>
  );
}
