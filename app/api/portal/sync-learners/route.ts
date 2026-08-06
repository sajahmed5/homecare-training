import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolvePortalOrg, isOrg } from "@/lib/portal-api";
import { createInvite } from "@/lib/invites";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";
// Invites send emails one by one; give the function room to breathe.
export const maxDuration = 60;

/**
 * The portal pushes its carers in as this organisation's learners.
 *
 * Body: { learners: [{ externalRef, email, fullName, status: "active"|"archived" }] }
 *
 * Matching order per row:
 *   1. external_ref — the permanent join; nothing else is trusted once set.
 *   2. email — adoption: a learner who already existed (e.g. invited by hand
 *      before the integration) is claimed by stamping the external_ref, once.
 *   3. nobody — a fresh invite is created; the platform's normal invite email
 *      asks them to set a password, and the auth trigger builds the profile.
 *
 * An archived carer is deactivated AND banned at the auth layer — leaving the
 * roster must also close the training account, on the same call.
 *
 * Every row reports its outcome; the caller shows the failures to a human
 * rather than this route pretending bulk success.
 */

interface LearnerRow {
  externalRef?: string;
  email?: string;
  fullName?: string;
  status?: "active" | "archived";
}

export async function POST(req: Request) {
  const org = await resolvePortalOrg(req);
  if (!isOrg(org)) return org;

  let body: { learners?: LearnerRow[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }
  const learners = Array.isArray(body.learners) ? body.learners : [];
  if (learners.length === 0 || learners.length > 1000) {
    return NextResponse.json({ error: "Send 1-1000 learners" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("users")
    .select("id, email, external_ref, status, full_name")
    .eq("organisation_id", org.id);
  const byRef = new Map((existing ?? []).filter((u) => u.external_ref).map((u) => [u.external_ref as string, u]));
  const byEmail = new Map((existing ?? []).map((u) => [(u.email ?? "").toLowerCase(), u]));

  const results: { externalRef: string; outcome: string; userId?: string; error?: string }[] = [];

  for (const row of learners) {
    const ref = (row.externalRef ?? "").trim();
    const email = (row.email ?? "").trim().toLowerCase();
    const wantActive = (row.status ?? "active") === "active";
    if (!ref) {
      results.push({ externalRef: ref, outcome: "error", error: "externalRef is required" });
      continue;
    }

    try {
      let user = byRef.get(ref) ?? (email ? byEmail.get(email) : undefined);

      if (!user) {
        if (!wantActive) {
          // Never provision an account for somebody who has already left.
          results.push({ externalRef: ref, outcome: "skipped_archived" });
          continue;
        }
        if (!email) {
          results.push({ externalRef: ref, outcome: "error", error: "No email address — cannot create a learner" });
          continue;
        }
        const invite = await createInvite({
          email,
          role: "learner",
          organisationId: org.id,
          fullName: row.fullName || email,
          orgName: org.name,
          roleLabel: "Learner",
        });
        if (!invite.userId) {
          results.push({ externalRef: ref, outcome: "error", error: "Invite failed — no user id returned" });
          continue;
        }
        await admin.from("users").update({ external_ref: ref }).eq("id", invite.userId);
        results.push({ externalRef: ref, outcome: "invited", userId: invite.userId });
        continue;
      }

      // Existing learner — adopt and/or update.
      const updates: Record<string, unknown> = {};
      if (!user.external_ref) updates.external_ref = ref;
      if (row.fullName && row.fullName !== user.full_name) updates.full_name = row.fullName;
      const wantStatus = wantActive ? "active" : "deactivated";
      if (user.status !== wantStatus) updates.status = wantStatus;
      if (Object.keys(updates).length) {
        const { error } = await admin.from("users").update(updates).eq("id", user.id).eq("organisation_id", org.id);
        if (error) throw new Error(error.message);
      }
      // Status also acts at the auth layer, mirroring setStaffStatusAction:
      // a deactivated learner cannot sign in at all.
      if (user.status !== wantStatus) {
        await admin.auth.admin.updateUserById(user.id, {
          ban_duration: wantActive ? "none" : "876000h",
        });
      }
      results.push({ externalRef: ref, outcome: user.external_ref ? "updated" : "adopted", userId: user.id });
    } catch (e) {
      results.push({ externalRef: ref, outcome: "error", error: e instanceof Error ? e.message : "Failed" });
    }
  }

  const counts = results.reduce<Record<string, number>>((acc, r) => {
    acc[r.outcome] = (acc[r.outcome] ?? 0) + 1;
    return acc;
  }, {});
  await logAudit({
    organisationId: org.id,
    action: "portal.sync_learners",
    entity: "users",
    detail: { counts, total: learners.length },
  });

  return NextResponse.json({ results, counts });
}
