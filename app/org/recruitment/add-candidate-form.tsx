"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addCandidateAction } from "./actions";

export function AddCandidateForm() {
  const [state, formAction, pending] = useActionState(addCandidateAction, {});

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="full_name">Full name</Label>
          <Input id="full_name" name="full_name" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="postcode">Postcode</Label>
          <Input id="postcode" name="postcode" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gender">Gender</Label>
          <Input id="gender" name="gender" />
        </div>
        <label className="flex items-end gap-2 pb-2 text-sm">
          <input type="checkbox" name="is_driver" /> Driver
        </label>
      </div>
      <div className="flex items-center gap-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Adding…" : "Add candidate"}
        </Button>
        {state.error && (
          <span className="text-sm text-destructive">{state.error}</span>
        )}
      </div>
    </form>
  );
}
