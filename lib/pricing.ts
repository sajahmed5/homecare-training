import { PACKAGE_TIERS, type PackageTier } from "@/lib/organisations";

/**
 * Monthly list price per tier in GBP, read from env
 * (PLATFORM_TIER_GBP_CORE, PLATFORM_TIER_GBP_CORE_FORMS,
 * PLATFORM_TIER_GBP_CORE_RECRUITMENT, PLATFORM_TIER_GBP_FULL).
 * Returns null when unset — revenue is shown only when configured, so we never
 * present a guessed figure. Stripe holds the authoritative prices; these mirror
 * them for the internal MRR estimate.
 */
export function tierMonthlyGbp(tier: PackageTier): number | null {
  const raw = process.env[`PLATFORM_TIER_GBP_${tier.toUpperCase()}`];
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** True if at least one tier price is configured. */
export function pricingConfigured(): boolean {
  return PACKAGE_TIERS.some((t) => tierMonthlyGbp(t.value) != null);
}
