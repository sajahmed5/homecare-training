-- ============================================================================
-- In-content question stars
-- ============================================================================
-- Learners earn a star the first time they answer an in-content H5P question
-- (MultiChoice / TrueFalse / DragText embedded in the reading pages) correctly.
-- Unlike the final assessment (whose stars are derived from quiz_attempts), an
-- in-content answer has nothing else to derive from, so each earned star is
-- recorded here. The unique(user_id, question_key) constraint is what makes a
-- question worth exactly one star forever — revisiting a page can never farm
-- more. Correctness is trusted from the client's H5P xAPI signal (H5P grades in
-- its iframe; the server can't re-grade), so this table is COSMETIC gamification
-- only and must never back a compliance/reporting path.
create table public.content_question_stars (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations (id) on delete cascade,
  user_id         uuid not null references public.users (id) on delete cascade,
  course_id       uuid not null references public.courses (id) on delete cascade,
  question_key    text not null,            -- xAPI statement.object.id (content + subContentId)
  awarded_at      timestamptz not null default now(),
  unique (user_id, question_key)
);
create index content_question_stars_user_idx on public.content_question_stars (user_id);

grant select on public.content_question_stars to authenticated;

alter table public.content_question_stars enable row level security;

-- Read own (learner) / own org (org_admin) / all (platform). Writes are made
-- server-side via the service-role client in awardContentStarAction.
create policy content_question_stars_learner_read on public.content_question_stars for select to authenticated
  using (user_id = (select auth.uid()));
create policy content_question_stars_org_admin_read on public.content_question_stars for select to authenticated
  using (
    public.current_user_role() = 'org_admin'
    and organisation_id = public.current_org_id()
  );
create policy content_question_stars_platform_admin on public.content_question_stars for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());
