import { NextResponse, type NextRequest } from "next/server";
import { processWeeklyDigest } from "@/lib/engine";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  return !!secret && req.headers.get("authorization") === `Bearer ${secret}`;
}

/** Weekly digest to each org admin. */
export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const dryRun = new URL(req.url).searchParams.get("dryRun") === "1";
  const digest = await processWeeklyDigest(new Date(), dryRun);
  return NextResponse.json({ ok: true, dryRun, ...digest });
}
