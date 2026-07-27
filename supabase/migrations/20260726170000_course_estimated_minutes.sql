-- ============================================================================
-- Per-course estimated duration
-- ============================================================================
-- The course intro previously showed a flat "about {pages × 2} min", which read
-- 26 min for every 13-page course. This column holds a realistic estimate
-- derived from each course's actual content (reading time + in-content
-- questions), computed by scripts/compute-durations.mjs. Nullable — the player
-- falls back to the pages-based formula when it's not set.
alter table public.courses
  add column if not exists estimated_minutes int;
