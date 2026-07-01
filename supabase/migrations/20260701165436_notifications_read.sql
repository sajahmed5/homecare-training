-- Learner notifications: remember when each user last viewed their notifications,
-- so the bell can show an unread count. Notifications themselves are derived
-- (from enrolments / certificates / expiry) — no notifications table needed.
alter table public.users
  add column notifications_read_at timestamptz not null default now();
