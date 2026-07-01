-- Phase 9 — Stripe billing. Subscription state on the organisation; feature
-- flags are driven by the webhook, never by the client.
alter table public.organisations
  add column stripe_customer_id     text,
  add column stripe_subscription_id text,
  add column subscription_status    text;

create index organisations_stripe_customer_idx
  on public.organisations (stripe_customer_id);
