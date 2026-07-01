import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { applySubscriptionToOrg, tierForPriceId } from "@/lib/billing";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

/** Stripe webhook — the ONLY thing that flips feature flags from billing. */
export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = req.headers.get("stripe-signature");
  if (!secret || !sig) {
    return NextResponse.json({ error: "not configured" }, { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    console.error("Stripe signature verification failed:", err);
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  const admin = createAdminClient();

  async function orgByCustomer(customerId: string): Promise<string | null> {
    const { data } = await admin
      .from("organisations")
      .select("id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();
    return data?.id ?? null;
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const organisationId = session.metadata?.organisation_id;
        const tier = session.metadata?.tier as
          | Parameters<typeof applySubscriptionToOrg>[1]["tier"]
          | undefined;
        if (organisationId && tier) {
          await applySubscriptionToOrg(admin, {
            organisationId,
            tier,
            customerId: session.customer as string,
            subscriptionId: session.subscription as string,
            status: "active",
          });
          await logAudit({
            organisationId,
            action: "billing.subscribed",
            entity: "organisation",
            entityId: organisationId,
            detail: { tier },
          });
        }
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const orgId = await orgByCustomer(sub.customer as string);
        const priceId = sub.items.data[0]?.price.id;
        const tier = priceId ? tierForPriceId(priceId) : null;
        if (orgId && tier) {
          await applySubscriptionToOrg(admin, {
            organisationId: orgId,
            tier,
            subscriptionId: sub.id,
            status: sub.status,
          });
        }
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const orgId = await orgByCustomer(sub.customer as string);
        if (orgId) {
          // Downgrade to Core (add-ons off) when the subscription ends.
          await applySubscriptionToOrg(admin, {
            organisationId: orgId,
            tier: "core",
            subscriptionId: null,
            status: "canceled",
          });
        }
        break;
      }
    }
  } catch (err) {
    console.error("Stripe webhook handler error:", err);
    return NextResponse.json({ error: "handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
