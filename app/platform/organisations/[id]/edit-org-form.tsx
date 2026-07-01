"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PACKAGE_TIERS, ORG_STATUSES } from "@/lib/organisations";
import {
  updateOrganisationAction,
  type SaveState,
} from "@/app/platform/actions";

export interface EditableOrg {
  id: string;
  name: string;
  package_tier: string;
  status: string;
  forms_enabled: boolean;
  recruitment_enabled: boolean;
}

const selectClass =
  "flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm";

export function EditOrgForm({ org }: { org: EditableOrg }) {
  const [state, action, pending] = useActionState(
    updateOrganisationAction,
    {} as SaveState,
  );
  const [forms, setForms] = useState(org.forms_enabled);
  const [recruitment, setRecruitment] = useState(org.recruitment_enabled);

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="id" value={org.id} />
      <input type="hidden" name="forms_enabled" value={String(forms)} />
      <input
        type="hidden"
        name="recruitment_enabled"
        value={String(recruitment)}
      />

      <div className="space-y-2">
        <Label htmlFor="name">Organisation name</Label>
        <Input id="name" name="name" defaultValue={org.name} required />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="package_tier">Package tier</Label>
          <select
            id="package_tier"
            name="package_tier"
            defaultValue={org.package_tier}
            className={selectClass}
          >
            {PACKAGE_TIERS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            defaultValue={org.status}
            className={selectClass}
          >
            {ORG_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <p className="text-sm font-medium">Forms add-on</p>
            <p className="text-xs text-muted-foreground">
              Enables the Forms builder for this organisation.
            </p>
          </div>
          <Switch checked={forms} onCheckedChange={setForms} />
        </div>

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <p className="text-sm font-medium">Recruitment add-on</p>
            <p className="text-xs text-muted-foreground">
              Enables the Recruitment tracker for this organisation.
            </p>
          </div>
          <Switch
            checked={recruitment}
            onCheckedChange={setRecruitment}
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
        {state.error && (
          <p role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        )}
        {state.ok && (
          <p className="text-sm text-green-700 dark:text-green-500">Saved.</p>
        )}
      </div>
    </form>
  );
}
