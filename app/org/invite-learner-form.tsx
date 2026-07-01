"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InviteResult } from "@/components/invite-result";
import type { InviteState } from "@/app/platform/actions";
import { inviteLearnerAction } from "./actions";

const initial: InviteState = {};

export function InviteLearnerForm() {
  const [state, formAction, pending] = useActionState(
    inviteLearnerAction,
    initial,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" name="name" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Inviting…" : "Invite learner"}
        </Button>
        <InviteResult state={state} />
      </div>
    </form>
  );
}
