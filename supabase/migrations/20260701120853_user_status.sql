-- Phase 3 — staff lifecycle. Deactivated users are blocked from their console
-- (and banned at the auth layer by the deactivate action).
alter table public.users
  add column status text not null default 'active'
  check (status in ('active', 'deactivated'));
