-- Richer assessment question types — still graded SERVER-SIDE.
--
-- The existing engine stored only single-answer MCQs (options + answer_index).
-- We add a `type` and a flexible `payload` so one bank can mix:
--   mcq         — single correct option            (uses options + answer_index)
--   multi       — select-all-that-apply            (payload.correctIndices: int[])
--   true_false  — true/false                       (uses options + answer_index)
--   fill_blank  — type the missing word(s)         (payload.blanks: [{answers:[...]}])
--   hotspot     — click the correct areas of an    (payload.image, payload.zones:
--                 image, e.g. "click the hazards"    [{id,x,y,w,h,correct,label}])
--
-- The correct answer for every type lives only in these columns, which RLS keeps
-- platform-admin-only; learners receive an answer-stripped projection from a
-- server action and the server grades the submission.

alter table public.quiz_questions
  add column if not exists type text not null default 'mcq',
  add column if not exists payload jsonb;

-- non-MCQ types don't use these two columns
alter table public.quiz_questions alter column options drop not null;
alter table public.quiz_questions alter column answer_index drop not null;

-- constrain the allowed types (drop first so the migration is re-runnable)
alter table public.quiz_questions drop constraint if exists quiz_questions_type_check;
alter table public.quiz_questions
  add constraint quiz_questions_type_check
  check (type in ('mcq','multi','true_false','fill_blank','hotspot'));

create index if not exists quiz_questions_course_type_idx
  on public.quiz_questions (course_id, type);
