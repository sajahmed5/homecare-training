-- Phase 2B — Care Certificate workplace observation & employer sign-off.
-- A paid add-on gated on organisations.observations_enabled, mirroring the
-- Forms / Recruitment add-on pattern. Records competence PER STANDARD (16 per
-- learner). Either the org's own assessors (org_admin) or MCA assessors
-- (platform_admin) may record; the final AWARD is reserved to the employer
-- (org_admin) — an external provider must not sign off the Care Certificate.

-- ============================================================================
-- Feature gate
-- ============================================================================
alter table public.organisations
  add column if not exists observations_enabled boolean not null default false;

create or replace function public.observations_enabled()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select observations_enabled from public.organisations where id = public.current_org_id()),
    false
  );
$$;
grant execute on function public.observations_enabled() to authenticated;

-- ============================================================================
-- Tables
-- ============================================================================
-- One observation record per learner per Care Certificate standard.
create table public.care_cert_observations (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations (id) on delete cascade,
  user_id         uuid not null references public.users (id) on delete cascade,
  standard_no     int not null check (standard_no between 1 and 16),
  status          text not null default 'pending'
                    check (status in ('pending', 'competent', 'not_yet_competent')),
  observed_at     date,
  assessor_id     uuid references public.users (id) on delete set null,
  assessor_kind   text check (assessor_kind in ('org', 'mca')),
  notes           text,
  evidence_path   text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (organisation_id, user_id, standard_no)
);
create index care_cert_observations_org_idx on public.care_cert_observations (organisation_id);
create index care_cert_observations_user_idx on public.care_cert_observations (user_id);

-- The employer's final award of the whole Care Certificate to a learner.
create table public.care_cert_signoffs (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations (id) on delete cascade,
  user_id         uuid not null references public.users (id) on delete cascade,
  signed_by       uuid not null references public.users (id) on delete set null,
  signed_at       timestamptz not null default now(),
  pdf_path        text,
  created_at      timestamptz not null default now(),
  unique (organisation_id, user_id)
);
create index care_cert_signoffs_org_idx on public.care_cert_signoffs (organisation_id);

create trigger care_cert_observations_set_updated_at before update on public.care_cert_observations
  for each row execute function public.set_updated_at();

-- ============================================================================
-- Grants
-- ============================================================================
grant select, insert, update, delete on public.care_cert_observations to authenticated;
grant select, insert, update, delete on public.care_cert_signoffs to authenticated;

-- ============================================================================
-- RLS — observations: org-scoped AND feature-gated for org_admin;
-- platform_admin (MCA assessor) bypasses; learner reads their own.
-- ============================================================================
alter table public.care_cert_observations enable row level security;

create policy cc_obs_platform_admin on public.care_cert_observations for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());

create policy cc_obs_org_admin on public.care_cert_observations for all to authenticated
  using (
    public.current_user_role() = 'org_admin'
    and organisation_id = public.current_org_id()
    and public.observations_enabled()
  )
  with check (
    public.current_user_role() = 'org_admin'
    and organisation_id = public.current_org_id()
    and public.observations_enabled()
  );

create policy cc_obs_learner_read on public.care_cert_observations for select to authenticated
  using (user_id = (select auth.uid()));

-- ============================================================================
-- RLS — sign-offs: the AWARD is the employer's. org_admin writes (gated);
-- platform_admin and the learner may READ but never award.
-- ============================================================================
alter table public.care_cert_signoffs enable row level security;

create policy cc_signoff_platform_read on public.care_cert_signoffs for select to authenticated
  using (public.is_platform_admin());

create policy cc_signoff_org_admin on public.care_cert_signoffs for all to authenticated
  using (
    public.current_user_role() = 'org_admin'
    and organisation_id = public.current_org_id()
    and public.observations_enabled()
  )
  with check (
    public.current_user_role() = 'org_admin'
    and organisation_id = public.current_org_id()
    and public.observations_enabled()
  );

create policy cc_signoff_learner_read on public.care_cert_signoffs for select to authenticated
  using (user_id = (select auth.uid()));

-- ============================================================================
-- Private bucket for observation evidence (photos, notes, documents).
-- Access is via service-role upload + signed URLs only — no public paths.
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('observation-evidence', 'observation-evidence', false)
on conflict (id) do nothing;
