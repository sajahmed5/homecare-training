"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PACKAGE_TIERS, tierLabel, type PackageTier } from "@/lib/organisations";
import { createCheckoutAction, createPortalAction } from "./actions";

const TIER_DESC: Record<PackageTier, string> = {
  core: "Training platform",
  core_forms: "Training + Forms builder",
  core_recruitment: "Training + Recruitment tracker",
  full: "Everything: Training + Forms + Recruitment",
};

export function BillingPanel({
  currentTier,
  hasCustomer,
}: {
  currentTier: PackageTier;
  hasCustomer: boolean;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function choose(tier: PackageTier) {
    setBusy(tier);
    setError(null);
    const { url, error } = await createCheckoutAction(tier);
    if (url) window.location.assign(url);
    else {
      setError(error ?? "Could not start checkout.");
      setBusy(null);
    }
  }

  async function portal() {
    setBusy("portal");
    setError(null);
    const { url, error } = await createPortalAction();
    if (url) window.location.assign(url);
    else {
      setError(error ?? "Could not open billing portal.");
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {PACKAGE_TIERS.map((t) => {
          const isCurrent = t.value === currentTier;
          return (
            <div
              key={t.value}
              className={`rounded-lg border p-4 ${isCurrent ? "border-primary" : ""}`}
            >
              <p className="font-medium">{tierLabel(t.value)}</p>
              <p className="mb-3 text-xs text-muted-foreground">
                {TIER_DESC[t.value]}
              </p>
              {isCurrent ? (
                <Button size="sm" variant="outline" disabled>
                  Current plan
                </Button>
              ) : (
                <Button
                  size="sm"
                  disabled={busy !== null}
                  onClick={() => choose(t.value)}
                >
                  {busy === t.value ? "…" : "Choose"}
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {hasCustomer && (
        <Button variant="outline" onClick={portal} disabled={busy !== null}>
          {busy === "portal" ? "…" : "Manage billing"}
        </Button>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
