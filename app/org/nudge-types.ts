/**
 * email_log.type values for the org-admin reminder kinds: chasing outstanding
 * training, chasing people who have never signed in, and chasing a certificate
 * that has lapsed or is about to.
 *
 * Kept out of nudge-actions.ts because that file is "use server" — such a
 * module may only export async functions, so a shared constant needs its own
 * home.
 */
export const NUDGE_TYPES = [
  "org_nudge",
  "org_signin_nudge",
  "org_renewal_nudge",
] as const;

/**
 * The groups an org admin can chase in bulk (issue #17.3). The first two are
 * buckets from bucketOf, so they mean exactly what the matching pills on the
 * learners list mean and never overlap each other. "Never signed in" is a
 * different lens — it can overlap either, because it is a different
 * conversation (sign in at all, rather than finish your training).
 */
export const NUDGE_GROUPS = [
  {
    key: "overdue",
    label: "Overdue training",
    blurb: "Staff with at least one course past its due date.",
  },
  {
    key: "not_started",
    label: "Not started",
    blurb: "Staff with training assigned who haven't opened any of it.",
  },
  {
    key: "never_signed_in",
    label: "Never signed in",
    blurb: "Staff who have never logged in — sends a set-password link.",
  },
] as const;

export type NudgeGroup = (typeof NUDGE_GROUPS)[number]["key"];
