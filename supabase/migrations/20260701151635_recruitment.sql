-- Phase 8 — Recruitment tracker (paid add-on, gated on organisations.recruitment_enabled).

-- ============================================================================
-- Feature-gate helper
-- ============================================================================
create or replace function public.recruitment_enabled()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select recruitment_enabled from public.organisations where id = public.current_org_id()),
    false
  );
$$;
grant execute on function public.recruitment_enabled() to authenticated;

-- ============================================================================
-- Tables
-- ============================================================================
create table public.candidates (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations (id) on delete cascade,
  full_name       text not null,
  gender          text,
  is_driver       boolean not null default false,
  postcode        text,
  email           text,
  phone           text,
  entry_date      date not null default current_date,
  stage           text not null default 'Applied',
  status          text not null default 'candidate' check (status in ('candidate', 'hired', 'rejected')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index candidates_org_idx on public.candidates (organisation_id);

create table public.candidate_documents (
  id              uuid primary key default gen_random_uuid(),
  candidate_id    uuid not null references public.candidates (id) on delete cascade,
  organisation_id uuid not null references public.organisations (id) on delete cascade,
  doc_type        text not null,   -- one of the required-document keys
  file_path       text not null,
  file_name       text,
  expires_at      date,            -- for DBS / right-to-work
  created_at      timestamptz not null default now()
);
create index candidate_documents_candidate_idx on public.candidate_documents (candidate_id);
create index candidate_documents_org_idx on public.candidate_documents (organisation_id);

create trigger candidates_set_updated_at before update on public.candidates
  for each row execute function public.set_updated_at();

-- ============================================================================
-- Grants
-- ============================================================================
grant select, insert, update, delete on public.candidates to authenticated;
grant select, insert, update, delete on public.candidate_documents to authenticated;

-- ============================================================================
-- RLS — org-scoped AND feature-gated. platform_admin bypasses.
-- ============================================================================
alter table public.candidates enable row level security;
alter table public.candidate_documents enable row level security;

create policy candidates_platform_admin on public.candidates for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy candidates_org_admin on public.candidates for all to authenticated
  using (
    public.current_user_role() = 'org_admin'
    and organisation_id = public.current_org_id()
    and public.recruitment_enabled()
  )
  with check (
    public.current_user_role() = 'org_admin'
    and organisation_id = public.current_org_id()
    and public.recruitment_enabled()
  );

create policy candidate_documents_platform_admin on public.candidate_documents for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy candidate_documents_org_admin on public.candidate_documents for all to authenticated
  using (
    public.current_user_role() = 'org_admin'
    and organisation_id = public.current_org_id()
    and public.recruitment_enabled()
  )
  with check (
    public.current_user_role() = 'org_admin'
    and organisation_id = public.current_org_id()
    and public.recruitment_enabled()
  );

-- ============================================================================
-- Private bucket for candidate documents
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('candidate-docs', 'candidate-docs', false)
on conflict (id) do nothing;
