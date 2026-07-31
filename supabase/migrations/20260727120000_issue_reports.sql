-- ============================================================================
-- Issue reports (in-app "Report a problem")
-- ============================================================================
-- Any signed-in user (learner / org_admin / platform_admin) can file a bug or
-- feedback report from the floating Report button. Each report gets a
-- human-friendly sequential number (report_no) so people can refer to "issue
-- 121". A report may carry an optional screenshot of the page it was filed from
-- (stored privately; see the issue-screenshots bucket below).
--
-- Rows are inserted server-side via the service-role client in
-- submitReportAction (which stamps the reporter's identity from their session),
-- so there is no client INSERT policy — mirroring certificates / quiz_attempts.
-- Reviewing happens on the platform-admin Issues page.
create table public.issue_reports (
  id              uuid primary key default gen_random_uuid(),
  report_no       bigint generated always as identity,  -- the human "#121"
  user_id         uuid references public.users (id) on delete set null,
  organisation_id uuid references public.organisations (id) on delete set null,
  reporter_email  text,
  reporter_role   text,
  page_path       text,                                 -- where it was reported from
  summary         text not null,                        -- "what's the issue"
  description     text,                                 -- "what's the problem"
  screenshot_path text,                                 -- issue-screenshots path (nullable)
  status          text not null default 'open'
                    check (status in ('open', 'reviewing', 'resolved')),
  admin_note      text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create unique index issue_reports_report_no_idx on public.issue_reports (report_no);
create index issue_reports_status_idx on public.issue_reports (status, created_at desc);

grant select on public.issue_reports to authenticated;

alter table public.issue_reports enable row level security;

-- Reporters can read their own reports; platform admins can read/manage all.
-- (Inserts are service-role only — see submitReportAction.)
create policy issue_reports_owner_read on public.issue_reports for select to authenticated
  using (user_id = (select auth.uid()));
create policy issue_reports_platform_admin on public.issue_reports for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());

create trigger issue_reports_set_updated_at
  before update on public.issue_reports
  for each row execute function public.set_updated_at();

-- ============================================================================
-- Private bucket for report screenshots.
-- Access is via service-role upload + signed URLs only — no public paths.
-- Screenshots can contain personal data, so capture is opt-in per report and
-- only platform admins can view them.
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('issue-screenshots', 'issue-screenshots', false)
on conflict (id) do nothing;
