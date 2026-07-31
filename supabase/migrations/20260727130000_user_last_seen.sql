-- ============================================================================
-- Last-active tracking
-- ============================================================================
-- Records when a user last used the site (any authenticated page load), giving
-- org admins a true "who is engaging / who isn't" signal. auth.users only has
-- last_sign_in_at, which barely changes because sessions persist for weeks — so
-- we maintain our own last_seen_at, touched (throttled) from the dashboard shell.
-- The write is done with the service-role client; org_admins read it via the
-- existing org-scoped users RLS policy (no new policy needed).
alter table public.users
  add column if not exists last_seen_at timestamptz;
