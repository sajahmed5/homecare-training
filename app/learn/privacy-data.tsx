"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { exportMyDataAction, deleteMyAccountAction } from "./privacy-actions";

export function PrivacyData() {
  const [busy, setBusy] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function exportData() {
    setBusy("export");
    setError(null);
    const { data, error } = await exportMyDataAction();
    setBusy(null);
    if (error || !data) {
      setError(error ?? "Export failed.");
      return;
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "my-care-academy-data.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function deleteAccount() {
    setBusy("delete");
    setError(null);
    const { ok, error } = await deleteMyAccountAction();
    if (!ok) {
      setBusy(null);
      setError(error ?? "Deletion failed.");
      return;
    }
    // Sign out client-side and leave.
    await createClient().auth.signOut();
    window.location.assign("/login");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" onClick={exportData} disabled={busy !== null}>
          {busy === "export" ? "Preparing…" : "Export my data"}
        </Button>
        {!confirming ? (
          <Button
            variant="destructive"
            onClick={() => setConfirming(true)}
            disabled={busy !== null}
          >
            Delete my account
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm">This permanently deletes your account.</span>
            <Button
              variant="destructive"
              size="sm"
              onClick={deleteAccount}
              disabled={busy !== null}
            >
              {busy === "delete" ? "Deleting…" : "Confirm delete"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirming(false)}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
