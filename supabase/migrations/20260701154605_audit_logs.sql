-- Phase 10 — audit trail for sensitive actions + data-retention setting.

create table public.audit_logs (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid references public.organisations (id) on delete set null,
  actor_id        uuid references public.users (id) on delete set null,
  actor_email     text,
  action          text not null,   -- e.g. organisation.updated, staff.deactivated
  entity          text,            -- table/domain the action touched
  entity_id       text,
  detail          jsonb,
  created_at      timestamptz not null default now()
);
create index audit_logs_org_idx on public.audit_logs (organisation_id);
create index audit_logs_created_idx on public.audit_logs (created_at desc);

grant select on public.audit_logs to authenticated;

alter table public.audit_logs enable row level security;

-- Writes happen via the service role only. Reads: platform_admin all; org_admin own org.
create policy audit_logs_platform_admin on public.audit_logs for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy audit_logs_org_admin_read on public.audit_logs for select to authenticated
  using (
    public.current_user_role() = 'org_admin'
    and organisation_id = public.current_org_id()
  );

-- Data-retention window (months) — configurable, surfaced in the runbook.
insert into public.app_settings (key, value)
values ('data_retention_months', '36'::jsonb)
on conflict (key) do nothing;
