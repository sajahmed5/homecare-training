-- Phase 6 — proactive engine: settings, reminder de-duplication, email audit.

-- ============================================================================
-- Configurable settings (platform-level key/value)
-- ============================================================================
create table public.app_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

insert into public.app_settings (key, value) values
  ('engagement_threshold_pct', '50'::jsonb),
  ('renewal_windows_days', '[60, 30, 7]'::jsonb),
  ('reminder_repeat_days', '7'::jsonb)
on conflict (key) do nothing;

-- ============================================================================
-- Reminder de-duplication
-- ============================================================================
-- Which renewal windows we've already emailed for a given certificate.
alter table public.certificates
  add column reminders_sent text[] not null default '{}';

-- When we last nudged the learner about this enrolment (overdue/not-started).
alter table public.enrolments
  add column last_reminder_at timestamptz;

-- ============================================================================
-- Email audit log
-- ============================================================================
create table public.email_log (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid references public.organisations (id) on delete set null,
  to_email        text not null,
  type            text not null,   -- digest | reminder | renewal | required_again | engagement_alert
  subject         text not null,
  sent            boolean not null default true,
  created_at      timestamptz not null default now()
);
create index email_log_org_idx on public.email_log (organisation_id);
create index email_log_created_idx on public.email_log (created_at desc);

-- ============================================================================
-- Grants + RLS
-- ============================================================================
grant select on public.app_settings to authenticated;
grant insert, update, delete on public.app_settings to authenticated;
grant select on public.email_log to authenticated;

alter table public.app_settings enable row level security;
alter table public.email_log enable row level security;

-- app_settings: everyone authenticated can read; only platform_admin writes.
create policy app_settings_read on public.app_settings for select to authenticated using (true);
create policy app_settings_write on public.app_settings for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());

-- email_log: platform_admin all; org_admin reads their org's log.
create policy email_log_platform_admin on public.email_log for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy email_log_org_admin_read on public.email_log for select to authenticated
  using (
    public.current_user_role() = 'org_admin'
    and organisation_id = public.current_org_id()
  );
