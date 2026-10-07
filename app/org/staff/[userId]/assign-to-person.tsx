"use client";

import { useActionState, useRef, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { assignTrainingAction, type AssignState } from "../../actions";

export interface AssignableCourse {
  id: string;
  title: string;
  /** They already have this one — shown, ticked off, not re-assignable. */
  already: boolean;
}

/**
 * Assign a course to the carer whose page you are on.
 *
 * Before this, giving one person one extra course meant leaving their page,
 * going to Courses → Assign training, finding them among fifty checkboxes and
 * coming back — six steps and two page loads for the commonest one-person
 * task (usability audit, 7 Oct 2026). Same server action as the bulk form,
 * with this carer pre-filled.
 */
export function AssignToPerson({
  userId,
  name,
  courses,
  defaultDueDate,
}: {
  userId: string;
  name: string;
  courses: AssignableCourse[];
  defaultDueDate: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const [state, formAction, pending] = useActionState(
    assignTrainingAction,
    {} as AssignState,
  );

  const available = courses.filter((c) => !c.already);

  if (!open) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={() => setOpen(true)} className="min-h-11 sm:min-h-9">
          <Plus className="size-4" /> Assign a course
        </Button>
        {state.ok && (
          <span className="text-sm text-green-700 dark:text-green-500">
            Assigned {state.courses} {state.courses === 1 ? "course" : "courses"} to{" "}
            {name.split(" ")[0]} ✓
          </span>
        )}
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-3 rounded-2xl border bg-card p-4">
      <input type="hidden" name="userIds" value={userId} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label>
          Assign to {name}{" "}
          <span className="font-normal text-muted-foreground">
            {picked === 0 ? "— nothing picked yet" : `— ${picked} picked`}
          </span>
        </Label>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="min-h-11 text-sm text-muted-foreground hover:underline sm:min-h-0"
        >
          Cancel
        </button>
      </div>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search courses…"
        aria-label="Search courses"
        className="min-h-11 w-full rounded-lg border px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:min-h-9"
      />

      <div
        ref={box}
        onChange={() =>
          setPicked(
            box.current?.querySelectorAll<HTMLInputElement>(
              'input[name="courseIds"]:checked',
            ).length ?? 0,
          )
        }
        className="grid max-h-56 gap-1 overflow-y-auto rounded-lg border p-3 sm:grid-cols-2"
      >
        {available.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {name} already has every course in the library.
          </p>
        ) : (
          available.map((c) => (
            <label
              key={c.id}
              hidden={!c.title.toLowerCase().includes(query.trim().toLowerCase())}
              className="flex min-h-11 items-center gap-2 text-sm sm:min-h-0"
            >
              <input type="checkbox" name="courseIds" value={c.id} className="size-4" />
              {c.title}
            </label>
          ))
        )}
      </div>

      <div className="grid gap-2 sm:max-w-xs">
        <Label htmlFor="dueDate">Due date</Label>
        <Input id="dueDate" name="dueDate" type="date" required defaultValue={defaultDueDate} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending} className="min-h-11 sm:min-h-9">
          {pending ? "Assigning…" : "Assign"}
        </Button>
        {state.error && <span className="text-sm text-destructive">{state.error}</span>}
        {state.ok && (
          <span className="text-sm text-green-700 dark:text-green-500">
            Assigned ✓{" "}
            <Link href="/org/courses/admin" className="underline">
              Assign to more people
            </Link>
          </span>
        )}
      </div>
    </form>
  );
}
