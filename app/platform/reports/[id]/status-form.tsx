"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { updateReportAction } from "../actions";
import {
  REPORT_STATUSES,
  STATUS_LABELS,
  type ReportStatus,
} from "../status";

const textareaClass =
  "flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

export function StatusForm({
  id,
  status,
  adminNote,
}: {
  id: string;
  status: string;
  adminNote: string | null;
}) {
  const router = useRouter();
  const [value, setValue] = useState<ReportStatus>(status as ReportStatus);
  const [note, setNote] = useState(adminNote ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);
    const res = await updateReportAction({ id, status: value, adminNote: note });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      router.refresh();
    } else {
      setError(res.error ?? "Couldn't save. Please try again.");
    }
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <div className="space-y-2">
        <Label>Status</Label>
        <div className="flex flex-wrap gap-2">
          {REPORT_STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setValue(s);
                setSaved(false);
              }}
              className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                value === s
                  ? "border-foreground bg-foreground text-background"
                  : "hover:bg-accent"
              }`}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="admin-note">Internal note (optional)</Label>
        <textarea
          id="admin-note"
          value={note}
          onChange={(e) => {
            setNote(e.target.value);
            setSaved(false);
          }}
          rows={3}
          maxLength={5000}
          placeholder="Notes for the team — e.g. root cause, fix reference"
          className={textareaClass}
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
        {saved && <span className="text-sm text-muted-foreground">Saved ✓</span>}
      </div>
    </form>
  );
}
