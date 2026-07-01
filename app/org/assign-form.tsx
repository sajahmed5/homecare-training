"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { assignTrainingAction, type AssignState } from "./actions";

const selectClass =
  "flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm";

export interface AssignOption {
  id: string;
  title: string;
}
export interface StaffOption {
  id: string;
  name: string;
}

export function AssignForm({
  courses,
  pathways,
  staff,
}: {
  courses: AssignOption[];
  pathways: AssignOption[];
  staff: StaffOption[];
}) {
  const [state, formAction, pending] = useActionState(
    assignTrainingAction,
    {} as AssignState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="target">Course or pathway</Label>
          <select id="target" name="target" required className={selectClass} defaultValue="">
            <option value="" disabled>
              Choose…
            </option>
            {pathways.length > 0 && (
              <optgroup label="Pathways">
                {pathways.map((p) => (
                  <option key={p.id} value={`pathway:${p.id}`}>
                    {p.title}
                  </option>
                ))}
              </optgroup>
            )}
            <optgroup label="Courses">
              {courses.map((c) => (
                <option key={c.id} value={`course:${c.id}`}>
                  {c.title}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dueDate">Due date (optional)</Label>
          <Input id="dueDate" name="dueDate" type="date" />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Assign to</Label>
        <div className="grid gap-2 rounded-lg border p-3 sm:grid-cols-2">
          {staff.map((s) => (
            <label key={s.id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="userIds" value={s.id} />
              {s.name}
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Assigning…" : "Assign training"}
        </Button>
        {state.error && (
          <span className="text-sm text-destructive">{state.error}</span>
        )}
        {state.ok && (
          <span className="text-sm text-green-700 dark:text-green-500">
            {state.count} enrolment(s) created/updated.
          </span>
        )}
      </div>
    </form>
  );
}
