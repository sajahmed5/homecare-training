"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InviteResult } from "@/components/invite-result";
import { invitePlatformAdminAction, type InviteState } from "./actions";

const initial: InviteState = {};

export function InviteAdminForm() {
  const [state, formAction, pending] = useActionState(
    invitePlatformAdminAction,
    initial,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="admin-name">Full name</Label>
          <Input id="admin-name" name="name" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="admin-email">Email</Label>
          <Input id="admin-email" name="email" type="email" required />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Inviting…" : "Add platform admin"}
        </Button>
        <InviteResult state={state} />
      </div>
    </form>
  );
}
