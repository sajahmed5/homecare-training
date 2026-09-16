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

const SAVED_MESSAGES: Record<string, string> = {
  sent: "Saved ✓ — the reporter has been emailed",
  failed: "Saved ✓ — but the email to the reporter didn't send",
  not_asked: "Saved ✓ — reporter not emailed",
  no_change: "Saved ✓ — nothing changed, so no email",
  no_reporter: "Saved ✓ — no email: the reporter's account is gone or deactivated",
};

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
  const [notify, setNotify] = useState(true);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(null);
    setError(null);
    const res = await updateReportAction({ id, status: value, adminNote: note, notify });
    setSaving(false);
    if (res.ok) {
      setSaved(SAVED_MESSAGES[res.emailed ?? "not_asked"]);
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
                setSaved(null);
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
        <Label htmlFor="admin-note">Note to the reporter (optional)</Label>
        <p className="text-xs text-muted-foreground">
          They see this on their My reports page, and in the email if you send one.
        </p>
        <textarea
          id="admin-note"
          value={note}
          onChange={(e) => {
            setNote(e.target.value);
            setSaved(null);
          }}
          rows={3}
          maxLength={5000}
          placeholder="What was changed, or what happens next"
          className={textareaClass}
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={notify}
          onChange={(e) => setNotify(e.target.checked)}
          className="size-4 rounded border-input"
        />
        Email the reporter about this update
      </label>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
        {saved && <span className="text-sm text-muted-foreground">{saved}</span>}
      </div>
    </form>
  );
}
