-- ============================================================================
-- Course summary recap
-- ============================================================================
-- A per-course "what you covered" recap, shown on the course summary screen
-- that sits between finishing the content and starting the assessment. Stored
-- as JSON text: { "intro": string, "points": string[] }. Nullable — a course
-- without a summary simply skips straight to the assessment CTA.
alter table public.courses
  add column if not exists summary text;
