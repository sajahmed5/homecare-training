/**
 * email_log.type values for the two org-admin reminder kinds: chasing
 * outstanding training, and chasing people who have never signed in.
 *
 * Kept out of nudge-actions.ts because that file is "use server" — such a
 * module may only export async functions, so a shared constant needs its own
 * home.
 */
export const NUDGE_TYPES = ["org_nudge", "org_signin_nudge"] as const;
