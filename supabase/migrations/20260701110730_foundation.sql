-- Phase 1a — Foundation: organisations, users, roles, RLS via JWT claims.
--
-- KEYSTONE: organisation_id and role are injected into the JWT by
-- custom_access_token_hook() at token-issue time, then read back in RLS policies
-- via auth.jwt(). RLS policies NEVER subquery public.users (that recurses / leaks).

-- ============================================================================
-- Enums
-- ============================================================================
create type public.user_role as enum ('platform_admin', 'org_admin', 'learner');

-- ============================================================================
-- Tables
-- ============================================================================
create table public.organisations (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  package_tier        text not null default 'core',
  forms_enabled       boolean not null default false,
  recruitment_enabled boolean not null default false,
  white_label_logo    text,
  status              text not null default 'active',   -- active | suspended
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table public.users (
  id              uuid primary key references auth.users (id) on delete cascade,
  organisation_id uuid references public.organisations (id) on delete cascade,
  role            public.user_role not null default 'learner',
  full_name       text,
  email           text not null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  -- platform_admin is global (no tenant); everyone else may belong to an org.
  constraint users_platform_admin_has_no_org
    check (role <> 'platform_admin' or organisation_id is null)
);

create index users_organisation_id_idx on public.users (organisation_id);

-- ============================================================================
-- updated_at maintenance
-- ============================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger organisations_set_updated_at
  before update on public.organisations
  for each row execute function public.set_updated_at();

create trigger users_set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

-- ============================================================================
-- Auto-provision a profile row when an auth user is created.
-- role / organisation_id / full_name are read from user metadata set at
-- creation time (admin API or, in Phase 1b, the invite flow).
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, role, organisation_id)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'learner'),
    (new.raw_user_meta_data ->> 'organisation_id')::uuid
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- Custom Access Token Hook — injects organisation_id + user_role into the JWT.
-- Runs as the supabase_auth_admin role during token issuance.
-- Enable it in Auth > Hooks (Customize Access Token) or via config.toml.
-- ============================================================================
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
as $$
declare
  claims  jsonb;
  v_role  public.user_role;
  v_org   uuid;
begin
  select role, organisation_id
    into v_role, v_org
    from public.users
   where id = (event ->> 'user_id')::uuid;

  claims := event -> 'claims';

  claims := jsonb_set(
    claims, '{user_role}',
    case when v_role is null then 'null'::jsonb else to_jsonb(v_role::text) end
  );
  claims := jsonb_set(
    claims, '{organisation_id}',
    case when v_org is null then 'null'::jsonb else to_jsonb(v_org::text) end
  );

  event := jsonb_set(event, '{claims}', claims);
  return event;
end;
$$;

-- The hook (run as supabase_auth_admin) must be able to read roles.
grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook(jsonb) from authenticated, anon, public;
grant select on public.users to supabase_auth_admin;

-- ============================================================================
-- Claim-reading helpers (read the JWT — NO table subquery, no recursion).
-- ============================================================================
create or replace function public.current_org_id()
returns uuid
language sql
stable
as $$
  select nullif(auth.jwt() ->> 'organisation_id', 'null')::uuid;
$$;

create or replace function public.current_user_role()
returns text
language sql
stable
as $$
  select auth.jwt() ->> 'user_role';
$$;

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() ->> 'user_role', '') = 'platform_admin';
$$;

-- ============================================================================
-- Grants (RLS still gates every row; these are the base privileges).
-- ============================================================================
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.organisations to authenticated;
grant select, insert, update, delete on public.users to authenticated;

-- ============================================================================
-- Row-Level Security
-- ============================================================================
alter table public.organisations enable row level security;
alter table public.users enable row level security;

-- Let the auth hook role read users (needed for token issuance).
create policy auth_admin_reads_users
  on public.users
  as permissive
  for select
  to supabase_auth_admin
  using (true);

-- --- organisations ---------------------------------------------------------
create policy platform_admin_all_organisations
  on public.organisations
  for all
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

create policy members_read_own_organisation
  on public.organisations
  for select
  to authenticated
  using (id = public.current_org_id());

-- --- users -----------------------------------------------------------------
create policy platform_admin_all_users
  on public.users
  for all
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

create policy read_own_user_row
  on public.users
  for select
  to authenticated
  using (id = (select auth.uid()));

create policy org_admin_reads_org_users
  on public.users
  for select
  to authenticated
  using (
    public.current_user_role() = 'org_admin'
    and organisation_id = public.current_org_id()
  );
