import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type UserRole = "platform_admin" | "org_admin" | "learner";

export interface UserContext {
  userId: string;
  email: string | null;
  /** From the JWT `user_role` claim (injected by custom_access_token_hook). */
  role: UserRole | null;
  /** From the JWT `organisation_id` claim. Null for platform_admin. */
  organisationId: string | null;
}

/** Landing route for each role. */
export function dashboardPathForRole(role: UserRole | null): string {
  switch (role) {
    case "platform_admin":
      return "/platform";
    case "org_admin":
      return "/org";
    case "learner":
      return "/learn";
    default:
      // Authenticated but no profile/role yet (e.g. self-signup before invite).
      return "/dashboard";
  }
}

function decodeJwtClaims(token: string): Record<string, unknown> {
  const payload = token.split(".")[1];
  if (!payload) return {};
  try {
    const json = Buffer.from(
      payload.replace(/-/g, "+").replace(/_/g, "/"),
      "base64",
    ).toString("utf8");
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function normaliseClaim(value: unknown): string | null {
  if (value === null || value === undefined || value === "null") return null;
  return String(value);
}

/**
 * Returns the authenticated user plus their role/org claims, or null if not
 * signed in. Auth is validated via getUser(); the custom claims are read from
 * the access token (populated by the JWT hook) — no extra DB round-trip.
 */
export async function getUserContext(): Promise<UserContext | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const claims = session ? decodeJwtClaims(session.access_token) : {};
  const role = normaliseClaim(claims["user_role"]) as UserRole | null;

  return {
    userId: user.id,
    email: user.email ?? null,
    role,
    organisationId: normaliseClaim(claims["organisation_id"]),
  };
}

/** Require an authenticated user; redirect to /login otherwise. */
export async function requireUser(): Promise<UserContext> {
  const context = await getUserContext();
  if (!context) redirect("/login");
  return context;
}

/** Roles that must complete MFA (AAL2) to use their console. */
const MFA_REQUIRED_ROLES: UserRole[] = ["platform_admin", "org_admin"];

/**
 * Admins must be at AAL2. If they aren't (no factor enrolled, or enrolled but
 * not stepped up this session), send them to /mfa to enrol or verify.
 *
 * Toggle with MFA_ENFORCED: set it to "false" to disable enforcement (the /mfa
 * flow still works for anyone who opts in). Defaults to enforced.
 */
export async function requireAdminMfa(): Promise<void> {
  if (process.env.MFA_ENFORCED === "false") return;

  const supabase = await createClient();
  const { data, error } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error || !data) return;
  if (data.currentLevel !== "aal2") redirect("/mfa");
}

/**
 * Blocks access for members whose account is deactivated or whose organisation
 * is suspended. platform_admin is global and unaffected. Degrades gracefully if
 * users.status doesn't exist yet (pre-migration).
 */
export async function assertActiveMember(context: UserContext): Promise<void> {
  if (context.role === "platform_admin") return;
  const supabase = await createClient();

  const [{ data: me }, { data: org }] = await Promise.all([
    supabase.from("users").select("status").eq("id", context.userId).single(),
    context.organisationId
      ? supabase
          .from("organisations")
          .select("status")
          .eq("id", context.organisationId)
          .single()
      : Promise.resolve({ data: null as { status?: string } | null }),
  ]);

  if (me?.status === "deactivated") redirect("/suspended");
  if (org?.status === "suspended") redirect("/suspended");
}

/**
 * Require a specific role. Authenticated users with the wrong role are sent to
 * their own dashboard. This is defence-in-depth over RLS, not a replacement.
 * Admin roles additionally require MFA (AAL2); org members are blocked if their
 * organisation is suspended.
 */
export async function requireRole(role: UserRole): Promise<UserContext> {
  const context = await requireUser();
  if (context.role !== role) redirect(dashboardPathForRole(context.role));
  if (MFA_REQUIRED_ROLES.includes(role)) await requireAdminMfa();
  if (role !== "platform_admin") await assertActiveMember(context);
  return context;
}
