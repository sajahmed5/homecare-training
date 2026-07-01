// Creates the 4 subscription products + monthly prices in Stripe (test mode),
// then prints the price ids to paste into .env.local. Idempotent-ish: it always
// creates new products, so run once.
//
//   node scripts/setup-stripe.mjs

import { config } from "dotenv";
config({ path: ".env.local" });
import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("Set STRIPE_SECRET_KEY in .env.local first.");
  process.exit(1);
}
const stripe = new Stripe(key);

const TIERS = [
  { env: "STRIPE_PRICE_CORE", name: "My Care Academy — Core", amount: 4900 },
  { env: "STRIPE_PRICE_CORE_FORMS", name: "My Care Academy — Core + Forms", amount: 6900 },
  { env: "STRIPE_PRICE_CORE_RECRUITMENT", name: "My Care Academy — Core + Recruitment", amount: 6900 },
  { env: "STRIPE_PRICE_FULL", name: "My Care Academy — Full", amount: 8900 },
];

for (const t of TIERS) {
  const product = await stripe.products.create({ name: t.name });
  const price = await stripe.prices.create({
    product: product.id,
    currency: "gbp",
    unit_amount: t.amount,
    recurring: { interval: "month" },
  });
  console.log(`${t.env}=${price.id}`);
}
console.log("\nPaste the lines above into .env.local, then restart the dev server.");
