"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export interface SettingsState {
  ok?: boolean;
  error?: string;
}

/** Update the configurable engine thresholds (platform_admin, RLS-enforced). */
export async function updateSettingsAction(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  await requireRole("platform_admin");

  const threshold = Number(formData.get("engagement_threshold") ?? 50);
  const repeat = Number(formData.get("reminder_repeat") ?? 7);
  const windows = String(formData.get("renewal_windows") ?? "")
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n > 0)
    .sort((a, b) => b - a);

  if (!Number.isFinite(threshold) || threshold < 0 || threshold > 100) {
    return { ok: false, error: "Engagement threshold must be 0–100." };
  }
  if (windows.length === 0) {
    return { ok: false, error: "Enter at least one renewal window (days)." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("app_settings").upsert([
    { key: "engagement_threshold_pct", value: threshold },
    { key: "renewal_windows_days", value: windows },
    { key: "reminder_repeat_days", value: repeat },
  ]);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/platform/settings");
  return { ok: true };
}
