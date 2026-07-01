import Stripe from "stripe";

let client: Stripe | null = null;

/** Lazily constructed Stripe client (avoids throwing at import time if the key is unset). */
export function getStripe(): Stripe {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set.");
    client = new Stripe(key);
  }
  return client;
}
