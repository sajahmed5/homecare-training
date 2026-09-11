import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolvePortalOrg, isOrg } from "@/lib/portal-api";
import { buildPortalRecords } from "@/lib/portal-records";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Every portal-managed learner's training state, keyed by the portal's own
 * carer id. This is the read the portal's training matrix, carer profiles and
 * oversight numbers are built from — the platform is the single source of
 * truth and this is its window.
 *
 * Certificate PDFs live in a private bucket; each certificate carries a
 * short-lived signed URL (1 hour), minted fresh on every call, so the portal
 * never needs storage credentials. See lib/portal-records for how it's
 * gathered and the limits that shaped it.
 */
export async function GET(req: Request) {
  const org = await resolvePortalOrg(req);
  if (!isOrg(org)) return org;
  return NextResponse.json(await buildPortalRecords(createAdminClient(), org.id));
}
