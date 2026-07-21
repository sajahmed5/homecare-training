-- Programmes: turn the pathways table into the backbone for the Care
-- Certificate programme page (a learner opens it and starts any standard).
-- Additive only — every new column has a default, so existing pathway reads,
-- the org-admin assign flow and the induction pathway keep working unchanged.
-- RLS is untouched: the existing pathways / pathway_courses / courses policies
-- (read-all authenticated, write platform_admin) already cover these columns.

-- A pathway can now describe a formal "programme" (e.g. the Care Certificate),
-- which the learner UI renders as a landing page rather than just an assign target.
alter table public.pathways
  add column if not exists kind text not null default 'pathway'
    check (kind in ('pathway', 'programme')),
  add column if not exists summary text,           -- long-form blurb for the landing page
  add column if not exists compliance_note text,   -- the knowledge-only / employer sign-off statement
  add column if not exists sort_order int not null default 0;

-- Per-course metadata within a programme: the standard label and its number,
-- so the 16 Care Certificate standards render in order with their names.
alter table public.pathway_courses
  add column if not exists label text,        -- e.g. "Standard 1 — Understand your role"
  add column if not exists standard_no int;   -- 1..16; orders and numbers the grid

create index if not exists pathway_courses_standard_idx
  on public.pathway_courses (pathway_id, standard_no);

-- Optional footer line on a course's certificate PDF — used to state that the
-- e-learning covers the knowledge element and the employer signs off competence.
alter table public.courses
  add column if not exists certificate_note text;
