import { createAdminClient } from "@/lib/supabase/admin";
import type { UserContext } from "@/lib/auth";

/**
 * Record a sensitive action in the audit trail. Best-effort — never throws into
 * the caller. Writes via the service role (audit_logs has no client insert policy).
 */
export async function logAudit(opts: {
  context?: UserContext | null;
  organisationId?: string | null;
  action: string;
  entity?: string;
  entityId?: string;
  detail?: Record<string, unknown>;
}): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from("audit_logs").insert({
      organisation_id:
        opts.organisationId ?? opts.context?.organisationId ?? null,
      actor_id: opts.context?.userId ?? null,
      actor_email: opts.context?.email ?? null,
      action: opts.action,
      entity: opts.entity ?? null,
      entity_id: opts.entityId ?? null,
      detail: opts.detail ?? null,
    });
  } catch (err) {
    console.error("audit log write failed:", err);
  }
}
