-- ============================================================================
-- Portal integration: external identity + per-organisation API key
-- ============================================================================
-- A care organisation's rostering portal pushes its carers in as learners and
-- allocates training server-to-server. Two pieces make that safe and stable:
--
-- 1. users.external_ref — the PORTAL's id for the person. Names and emails
--    change; this doesn't. It is the join key for every integration call, so
--    a rename on either side never breaks the link. Unique per organisation
--    (two orgs may both have a carer "1234"); null for everyone not managed
--    by an external system.
--
-- 2. organisations.integration_key_hash — sha256 of the org's API key. The
--    key itself lives only in the portal's server config; this table stores
--    the hash, so neither this (public) repository nor a database read-out
--    reveals a usable credential. Generate a key with:
--       node scripts/portal-key.mjs
--    and run the UPDATE it prints.
alter table public.users
  add column if not exists external_ref text;

create unique index if not exists users_org_external_ref_key
  on public.users (organisation_id, external_ref)
  where external_ref is not null;

alter table public.organisations
  add column if not exists integration_key_hash text,
  add column if not exists integration_key_created_at timestamptz;

-- No RLS changes: external_ref rides along under the existing users policies,
-- and integration_key_hash is only ever read by the service role (the
-- organisations table has no learner-facing select of these columns' rows
-- beyond the org's own admins, for whom a hash is not a credential).
