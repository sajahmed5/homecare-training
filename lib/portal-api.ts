import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Server-to-server auth for the /api/portal/* routes.
 *
 * A rostering portal calls with `Authorization: Bearer <key>`; the sha256 of
 * the key is matched against organisations.integration_key_hash, which both
 * authenticates the caller and — more importantly — RESOLVES WHICH ORG it is.
 * Every route then scopes every read and write to that organisation
 * explicitly, because the admin client bypasses RLS and would otherwise see
 * everyone's data.
 *
 * The comparison hashes first and compares hashes timing-safely, so neither
 * string length nor prefix leaks; a wrong key and a missing org answer
 * identically.
 */

export interface PortalOrg {
  id: string;
  name: string;
}

export async function resolvePortalOrg(req: Request): Promise<PortalOrg | NextResponse> {
  const auth = req.headers.get("authorization") ?? "";
  const key = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!key) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const hash = crypto.createHash("sha256").update(key).digest("hex");
  const admin = createAdminClient();
  const { data } = await admin
    .from("organisations")
    .select("id, name, status, integration_key_hash")
    .eq("integration_key_hash", hash)
    .limit(1)
    .maybeSingle();

  if (
    !data?.integration_key_hash ||
    !crypto.timingSafeEqual(Buffer.from(data.integration_key_hash), Buffer.from(hash))
  ) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  if (data.status !== "active") {
    return NextResponse.json({ error: "Organisation is not active" }, { status: 403 });
  }
  return { id: data.id, name: data.name };
}

export const isOrg = (v: PortalOrg | NextResponse): v is PortalOrg => !(v instanceof NextResponse);
