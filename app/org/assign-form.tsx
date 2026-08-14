"use client";

import { useActionState, useRef, useState } from "react";
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
  courses: coursesIn,
  pathways,
  staff: staffIn,
  defaultDueDate,
}: {
  courses: AssignOption[];
  pathways: AssignOption[];
  staff: StaffOption[];
  /** Pre-filled due date (end of the current month). Due dates are mandatory. */
  defaultDueDate: string;
}) {
  // Alphabetical lists are easier to scan (design doc v2).
  const courses = [...coursesIn].sort((a, b) => a.title.localeCompare(b.title));
  const staff = [...staffIn].sort((a, b) => a.name.localeCompare(b.name));
  const [state, formAction, pending] = useActionState(
    assignTrainingAction,
    {} as AssignState,
  );
  const [allCarers, setAllCarers] = useState(false);
  const staffBox = useRef<HTMLDivElement>(null);

  function toggleAllStaff(checked: boolean) {
    staffBox.current
      ?.querySelectorAll<HTMLInputElement>('input[name="userIds"]')
      .forEach((cb) => (cb.checked = checked));
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="pathway">Whole pathway (optional)</Label>
          <select id="pathway" name="pathway" className={selectClass} defaultValue="">
            <option value="">None</option>
            {pathways.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="dueDate">Due date</Label>
          <Input
            id="dueDate"
            name="dueDate"
            type="date"
            required
            defaultValue={defaultDueDate}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Courses</Label>
        <div className="grid max-h-48 gap-2 overflow-y-auto rounded-lg border p-3 sm:grid-cols-2">
          {courses.map((c) => (
            <label key={c.id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="courseIds" value={c.id} />
              {c.title}
            </label>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Pick one or more courses (and/or a pathway above).
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Assign to</Label>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              name="all"
              checked={allCarers}
              onChange={(e) => {
                setAllCarers(e.target.checked);
                toggleAllStaff(e.target.checked);
              }}
            />
            All carers
          </label>
        </div>
        <div
          ref={staffBox}
          className={`grid max-h-48 gap-2 overflow-y-auto rounded-lg border p-3 sm:grid-cols-2 ${
            allCarers ? "pointer-events-none opacity-50" : ""
          }`}
        >
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
