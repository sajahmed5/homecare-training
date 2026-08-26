import { headers } from "next/headers";

/**
 * Absolute origin for links in outgoing email, working in dev and prod.
 *
 * Lived privately in both lib/invites and the nudge actions; a third copy was
 * one too many, and a link built from the wrong origin is the sort of thing
 * nobody notices until a learner clicks it.
 */
export async function siteOrigin(): Promise<string> {
  if (process.env.NEXT_PUBLIC_SITE_URL)
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}
