"use server";

import { headers } from "next/headers";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import { priceIdForTier } from "@/lib/billing";
import type { PackageTier } from "@/lib/organisations";

async function origin(): Promise<string> {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

/** Create a Stripe Checkout session for a tier and return its URL. */
export async function createCheckoutAction(
  tier: PackageTier,
): Promise<{ url?: string; error?: string }> {
  const context = await requireRole("org_admin");
  const priceId = priceIdForTier(tier);
  if (!priceId) return { error: "Billing isn't configured for this plan yet." };

  const admin = createAdminClient();
  const { data: org } = await admin
    .from("organisations")
    .select("id, name, stripe_customer_id")
    .eq("id", context.organisationId!)
    .single();
  if (!org) return { error: "Organisation not found." };

  const stripe = getStripe();

  let customerId = org.stripe_customer_id as string | null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      name: org.name,
      email: context.email ?? undefined,
      metadata: { organisation_id: org.id },
    });
    customerId = customer.id;
    await admin
      .from("organisations")
      .update({ stripe_customer_id: customerId })
      .eq("id", org.id);
  }

  const base = await origin();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${base}/org/billing?success=1`,
    cancel_url: `${base}/org/billing`,
    metadata: { organisation_id: org.id, tier },
    subscription_data: { metadata: { organisation_id: org.id } },
  });

  return { url: session.url ?? undefined };
}

/** Create a Stripe Customer Portal session and return its URL. */
export async function createPortalAction(): Promise<{
  url?: string;
  error?: string;
}> {
  const context = await requireRole("org_admin");
  const admin = createAdminClient();
  const { data: org } = await admin
    .from("organisations")
    .select("stripe_customer_id")
    .eq("id", context.organisationId!)
    .single();
  if (!org?.stripe_customer_id) {
    return { error: "No billing account yet — subscribe to a plan first." };
  }

  const base = await origin();
  const session = await getStripe().billingPortal.sessions.create({
    customer: org.stripe_customer_id,
    return_url: `${base}/org/billing`,
  });
  return { url: session.url };
}
