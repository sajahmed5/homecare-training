-- Certificates run 12 months by default (Saj, 27 Sept 2026: "default expiry
-- will be 365 days after user completes course").
-- Courses on the old 24-month default move to 12; courses deliberately set to
-- something else (12 already, Introduction to Care at 36, 0 = never) keep it.
-- New courses start at 12.
alter table courses alter column expiry_months set default 12;
update courses set expiry_months = 12 where expiry_months = 24;
