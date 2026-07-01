import type { SupabaseClient } from "@supabase/supabase-js";
import type { PackageTier } from "@/lib/organisations";

/** Feature flags entailed by each package tier. */
export function tierFlags(tier: PackageTier): {
  forms_enabled: boolean;
  recruitment_enabled: boolean;
} {
  return {
    forms_enabled: tier === "core_forms" || tier === "full",
    recruitment_enabled: tier === "core_recruitment" || tier === "full",
  };
}

/** Env var holding each tier's Stripe price id. */
const TIER_PRICE_ENV: Record<PackageTier, string> = {
  core: "STRIPE_PRICE_CORE",
  core_forms: "STRIPE_PRICE_CORE_FORMS",
  core_recruitment: "STRIPE_PRICE_CORE_RECRUITMENT",
  full: "STRIPE_PRICE_FULL",
};

export function priceIdForTier(tier: PackageTier): string | undefined {
  return process.env[TIER_PRICE_ENV[tier]];
}

export function tierForPriceId(priceId: string): PackageTier | null {
  for (const tier of Object.keys(TIER_PRICE_ENV) as PackageTier[]) {
    const id = process.env[TIER_PRICE_ENV[tier]];
    if (id && id === priceId) return tier;
  }
  return null;
}

/**
 * Apply a subscription's tier to an organisation: sets package_tier and the
 * entailed feature flags. This is the ONLY place flags change from billing —
 * the webhook calls it.
 */
export async function applySubscriptionToOrg(
  admin: SupabaseClient,
  params: {
    organisationId: string;
    tier: PackageTier;
    customerId?: string;
    subscriptionId?: string | null;
    status?: string;
  },
): Promise<void> {
  const flags = tierFlags(params.tier);
  await admin
    .from("organisations")
    .update({
      package_tier: params.tier,
      forms_enabled: flags.forms_enabled,
      recruitment_enabled: flags.recruitment_enabled,
      ...(params.customerId ? { stripe_customer_id: params.customerId } : {}),
      ...(params.subscriptionId !== undefined
        ? { stripe_subscription_id: params.subscriptionId }
        : {}),
      ...(params.status ? { subscription_status: params.status } : {}),
    })
    .eq("id", params.organisationId);
}
