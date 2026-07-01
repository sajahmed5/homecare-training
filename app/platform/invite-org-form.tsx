"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InviteResult } from "@/components/invite-result";
import { inviteOrganisationAction, type InviteState } from "./actions";

const initial: InviteState = {};

export function InviteOrgForm() {
  const [state, formAction, pending] = useActionState(
    inviteOrganisationAction,
    initial,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="orgName">Organisation name</Label>
          <Input id="orgName" name="orgName" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="adminName">Admin full name</Label>
          <Input id="adminName" name="adminName" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="adminEmail">Admin email</Label>
          <Input id="adminEmail" name="adminEmail" type="email" required />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Inviting…" : "Invite organisation"}
        </Button>
        <InviteResult state={state} />
      </div>
    </form>
  );
}
