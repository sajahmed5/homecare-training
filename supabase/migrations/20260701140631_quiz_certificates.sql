-- Phase 5 — quizzes & certificates.
--
-- quiz_questions carry the correct answer, so they are NEVER exposed to learners
-- via RLS. Quizzes are generated and graded server-side (service role); learners
-- only ever see questions without answers, returned by a server action.

-- ============================================================================
-- Question bank (platform-owned catalogue content)
-- ============================================================================
create table public.quiz_questions (
  id           uuid primary key default gen_random_uuid(),
  course_id    uuid not null references public.courses (id) on delete cascade,
  question     text not null,
  options      jsonb not null,      -- array of option strings
  answer_index int not null,        -- index of the correct option
  sort_order   int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index quiz_questions_course_id_idx on public.quiz_questions (course_id);

-- ============================================================================
-- Quiz attempts (one row per sitting; never resumable)
-- ============================================================================
create table public.quiz_attempts (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations (id) on delete cascade,
  user_id         uuid not null references public.users (id) on delete cascade,
  course_id       uuid not null references public.courses (id) on delete cascade,
  question_ids    jsonb not null,           -- the selected question ids
  answers         jsonb,                    -- learner's chosen indices
  score           int,                      -- percentage 0-100
  passed          boolean,
  started_at      timestamptz not null default now(),
  submitted_at    timestamptz,
  created_at      timestamptz not null default now()
);
create index quiz_attempts_user_course_idx on public.quiz_attempts (user_id, course_id);
create index quiz_attempts_org_idx on public.quiz_attempts (organisation_id);

-- ============================================================================
-- Certificates (a fresh one per pass; newest is the live one)
-- ============================================================================
create table public.certificates (
  id                 uuid primary key default gen_random_uuid(),
  certificate_number text not null unique,
  organisation_id    uuid not null references public.organisations (id) on delete cascade,
  user_id            uuid not null references public.users (id) on delete cascade,
  course_id          uuid not null references public.courses (id) on delete cascade,
  issued_at          timestamptz not null default now(),
  expires_at         timestamptz,           -- null = never expires
  pdf_path           text,                  -- path in the certificates storage bucket
  created_at         timestamptz not null default now()
);
create index certificates_user_course_idx on public.certificates (user_id, course_id);
create index certificates_org_idx on public.certificates (organisation_id);

-- updated_at trigger
create trigger quiz_questions_set_updated_at before update on public.quiz_questions
  for each row execute function public.set_updated_at();

-- ============================================================================
-- Grants
-- ============================================================================
grant select, insert, update, delete on public.quiz_questions to authenticated;
grant select on public.quiz_attempts to authenticated;
grant select on public.certificates to authenticated;

-- ============================================================================
-- RLS
-- ============================================================================
alter table public.quiz_questions enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.certificates enable row level security;

-- quiz_questions: platform_admin only (contains answers). Server grades via service role.
create policy quiz_questions_platform_admin on public.quiz_questions for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());

-- quiz_attempts: read own (learner) / own org (org_admin) / all (platform). Writes server-side only.
create policy quiz_attempts_learner_read on public.quiz_attempts for select to authenticated
  using (user_id = (select auth.uid()));
create policy quiz_attempts_org_admin_read on public.quiz_attempts for select to authenticated
  using (
    public.current_user_role() = 'org_admin'
    and organisation_id = public.current_org_id()
  );
create policy quiz_attempts_platform_admin on public.quiz_attempts for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());

-- certificates: same read visibility. Writes server-side only.
create policy certificates_learner_read on public.certificates for select to authenticated
  using (user_id = (select auth.uid()));
create policy certificates_org_admin_read on public.certificates for select to authenticated
  using (
    public.current_user_role() = 'org_admin'
    and organisation_id = public.current_org_id()
  );
create policy certificates_platform_admin on public.certificates for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());

-- ============================================================================
-- Public certificate verification — returns NON-PII only, by number.
-- SECURITY DEFINER so the public verify page needs no auth and no table access.
-- ============================================================================
create or replace function public.verify_certificate(cert_number text)
returns table (
  valid        boolean,
  course_title text,
  issued_at    timestamptz,
  expires_at   timestamptz,
  is_expired   boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    true as valid,
    co.title as course_title,
    c.issued_at,
    c.expires_at,
    (c.expires_at is not null and c.expires_at < now()) as is_expired
  from public.certificates c
  join public.courses co on co.id = c.course_id
  where c.certificate_number = cert_number;
$$;

grant execute on function public.verify_certificate(text) to anon, authenticated;

-- ============================================================================
-- Private storage bucket for certificate PDFs (served via signed URLs)
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('certificates', 'certificates', false)
on conflict (id) do nothing;
