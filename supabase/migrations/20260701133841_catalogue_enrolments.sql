-- Phase 4 — course catalogue (shared across all orgs) + tenant-scoped enrolments.
--
-- Catalogue (topics/courses/pathways) is global content readable by every
-- authenticated user and writable only by platform_admin. Enrolments are
-- tenant-scoped like the rest of the app.

-- ============================================================================
-- Catalogue tables
-- ============================================================================
create table public.topics (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  slug       text not null unique,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.courses (
  id             uuid primary key default gen_random_uuid(),
  topic_id       uuid references public.topics (id) on delete set null,
  title          text not null,
  slug           text not null unique,
  description    text,
  content_blocks jsonb not null default '[]'::jsonb,
  expiry_months  int not null default 24, -- 0 = never expires
  sort_order     int not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table public.pathways (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  slug        text not null unique,
  description text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.pathway_courses (
  pathway_id uuid not null references public.pathways (id) on delete cascade,
  course_id  uuid not null references public.courses (id) on delete cascade,
  sort_order int not null default 0,
  primary key (pathway_id, course_id)
);

-- ============================================================================
-- Enrolments (tenant-scoped)
-- ============================================================================
create table public.enrolments (
  id               uuid primary key default gen_random_uuid(),
  organisation_id  uuid not null references public.organisations (id) on delete cascade,
  user_id          uuid not null references public.users (id) on delete cascade,
  course_id        uuid not null references public.courses (id) on delete cascade,
  status           text not null default 'not_started'
                     check (status in ('not_started', 'in_progress', 'completed', 'expired')),
  progress         int not null default 0,   -- 0-100 (content completion)
  time_spent       int not null default 0,   -- seconds
  current_block    int not null default 0,   -- resume position in content_blocks
  due_date         date,
  completion_count int not null default 0,
  attempt_count    int not null default 0,
  assigned_at      timestamptz not null default now(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (user_id, course_id)
);

create index enrolments_organisation_id_idx on public.enrolments (organisation_id);
create index enrolments_user_id_idx on public.enrolments (user_id);
create index enrolments_course_id_idx on public.enrolments (course_id);
create index courses_topic_id_idx on public.courses (topic_id);

-- updated_at triggers
create trigger topics_set_updated_at before update on public.topics
  for each row execute function public.set_updated_at();
create trigger courses_set_updated_at before update on public.courses
  for each row execute function public.set_updated_at();
create trigger pathways_set_updated_at before update on public.pathways
  for each row execute function public.set_updated_at();
create trigger enrolments_set_updated_at before update on public.enrolments
  for each row execute function public.set_updated_at();

-- ============================================================================
-- Grants
-- ============================================================================
grant select on public.topics, public.courses, public.pathways, public.pathway_courses to authenticated;
grant insert, update, delete on public.topics, public.courses, public.pathways, public.pathway_courses to authenticated;
grant select, insert, update, delete on public.enrolments to authenticated;

-- ============================================================================
-- RLS — catalogue: read for all authenticated, write for platform_admin only
-- ============================================================================
alter table public.topics enable row level security;
alter table public.courses enable row level security;
alter table public.pathways enable row level security;
alter table public.pathway_courses enable row level security;

create policy topics_read on public.topics for select to authenticated using (true);
create policy topics_write on public.topics for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());

create policy courses_read on public.courses for select to authenticated using (true);
create policy courses_write on public.courses for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());

create policy pathways_read on public.pathways for select to authenticated using (true);
create policy pathways_write on public.pathways for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());

create policy pathway_courses_read on public.pathway_courses for select to authenticated using (true);
create policy pathway_courses_write on public.pathway_courses for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());

-- ============================================================================
-- RLS — enrolments (tenant-scoped)
-- ============================================================================
alter table public.enrolments enable row level security;

-- platform_admin: everything
create policy enrolments_platform_admin on public.enrolments for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());

-- learner: read + update their own enrolment (progress/time/resume)
create policy enrolments_learner_read on public.enrolments for select to authenticated
  using (user_id = (select auth.uid()));
create policy enrolments_learner_update on public.enrolments for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- org_admin: read + assign (insert) + update within their own org
create policy enrolments_org_admin_read on public.enrolments for select to authenticated
  using (
    public.current_user_role() = 'org_admin'
    and organisation_id = public.current_org_id()
  );
create policy enrolments_org_admin_insert on public.enrolments for insert to authenticated
  with check (
    public.current_user_role() = 'org_admin'
    and organisation_id = public.current_org_id()
  );
create policy enrolments_org_admin_update on public.enrolments for update to authenticated
  using (
    public.current_user_role() = 'org_admin'
    and organisation_id = public.current_org_id()
  )
  with check (
    public.current_user_role() = 'org_admin'
    and organisation_id = public.current_org_id()
  );
