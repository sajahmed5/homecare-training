"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InviteResult } from "@/components/invite-result";
import type { InviteState } from "@/app/platform/actions";
import { inviteStaffAction } from "../actions";

const initial: InviteState = {};

/** Invite another organisation admin — same access as the current one. */
export function AddAdminForm() {
  const [state, formAction, pending] = useActionState(
    inviteStaffAction,
    initial,
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="role" value="org_admin" />
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
          {pending ? "Sending invite…" : "Invite admin"}
        </Button>
      </div>
      <InviteResult state={state} />
    </form>
  );
}
