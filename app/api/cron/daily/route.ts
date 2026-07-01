import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  loadSettings,
  processRenewals,
  processReminders,
  processEngagement,
} from "@/lib/engine";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  return !!secret && req.headers.get("authorization") === `Bearer ${secret}`;
}

/** Daily engine run: renewals (expire + remind), learner reminders, engagement alerts. */
export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const dryRun = new URL(req.url).searchParams.get("dryRun") === "1";
  const now = new Date();

  const admin = createAdminClient();
  const settings = await loadSettings(admin);

  const renewals = await processRenewals(settings, now, dryRun);
  const reminders = await processReminders(settings, now, dryRun);
  const engagement = await processEngagement(settings, now, dryRun);

  return NextResponse.json({
    ok: true,
    dryRun,
    ...renewals,
    ...reminders,
    ...engagement,
  });
}
