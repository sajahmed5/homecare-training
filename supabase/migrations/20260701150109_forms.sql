-- Phase 7 — Forms builder (paid add-on, gated on organisations.forms_enabled).

-- ============================================================================
-- Feature-gate helper: is the caller's org entitled to Forms?
-- SECURITY DEFINER so RLS can check the flag without exposing organisations.
-- ============================================================================
create or replace function public.forms_enabled()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select forms_enabled from public.organisations where id = public.current_org_id()),
    false
  );
$$;
grant execute on function public.forms_enabled() to authenticated;

-- ============================================================================
-- Tables
-- ============================================================================
create table public.forms (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations (id) on delete cascade,
  title           text not null,
  description     text,
  status          text not null default 'draft' check (status in ('draft', 'published')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index forms_org_idx on public.forms (organisation_id);

create table public.form_fields (
  id              uuid primary key default gen_random_uuid(),
  form_id         uuid not null references public.forms (id) on delete cascade,
  organisation_id uuid not null references public.organisations (id) on delete cascade,
  label           text not null,
  type            text not null,        -- text|textarea|number|date|select|radio|checkbox|file|signature
  options         jsonb not null default '[]'::jsonb,   -- for select/radio/checkbox
  required        boolean not null default false,
  conditional     jsonb,                -- { whenFieldId, equals } => show only when matched
  sort_order      int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index form_fields_form_idx on public.form_fields (form_id);

create table public.form_submissions (
  id              uuid primary key default gen_random_uuid(),
  form_id         uuid not null references public.forms (id) on delete cascade,
  organisation_id uuid not null references public.organisations (id) on delete cascade,
  submitted_by    uuid references public.users (id) on delete set null,
  data            jsonb not null,       -- fieldId -> value
  created_at      timestamptz not null default now()
);
create index form_submissions_form_idx on public.form_submissions (form_id);
create index form_submissions_org_idx on public.form_submissions (organisation_id);

create trigger forms_set_updated_at before update on public.forms
  for each row execute function public.set_updated_at();
create trigger form_fields_set_updated_at before update on public.form_fields
  for each row execute function public.set_updated_at();

-- ============================================================================
-- Grants
-- ============================================================================
grant select, insert, update, delete on public.forms to authenticated;
grant select, insert, update, delete on public.form_fields to authenticated;
grant select, insert, update, delete on public.form_submissions to authenticated;

-- ============================================================================
-- RLS — org-scoped AND feature-gated. platform_admin bypasses.
-- ============================================================================
alter table public.forms enable row level security;
alter table public.form_fields enable row level security;
alter table public.form_submissions enable row level security;

-- forms: org members read when the feature is on; org_admin manages.
create policy forms_platform_admin on public.forms for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy forms_org_read on public.forms for select to authenticated
  using (organisation_id = public.current_org_id() and public.forms_enabled());
create policy forms_org_admin_write on public.forms for all to authenticated
  using (
    public.current_user_role() = 'org_admin'
    and organisation_id = public.current_org_id()
    and public.forms_enabled()
  )
  with check (
    public.current_user_role() = 'org_admin'
    and organisation_id = public.current_org_id()
    and public.forms_enabled()
  );

-- form_fields: same shape.
create policy form_fields_platform_admin on public.form_fields for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy form_fields_org_read on public.form_fields for select to authenticated
  using (organisation_id = public.current_org_id() and public.forms_enabled());
create policy form_fields_org_admin_write on public.form_fields for all to authenticated
  using (
    public.current_user_role() = 'org_admin'
    and organisation_id = public.current_org_id()
    and public.forms_enabled()
  )
  with check (
    public.current_user_role() = 'org_admin'
    and organisation_id = public.current_org_id()
    and public.forms_enabled()
  );

-- form_submissions: org members can submit + read within their org (feature on).
create policy form_submissions_platform_admin on public.form_submissions for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy form_submissions_org_read on public.form_submissions for select to authenticated
  using (organisation_id = public.current_org_id() and public.forms_enabled());
create policy form_submissions_org_insert on public.form_submissions for insert to authenticated
  with check (organisation_id = public.current_org_id() and public.forms_enabled());

-- ============================================================================
-- Private bucket for form file uploads
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('form-uploads', 'form-uploads', false)
on conflict (id) do nothing;
