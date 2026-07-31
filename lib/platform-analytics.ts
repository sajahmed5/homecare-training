import type { SupabaseClient } from "@supabase/supabase-js";
import { PACKAGE_TIERS, type PackageTier } from "@/lib/organisations";
import { tierMonthlyGbp, pricingConfigured } from "@/lib/pricing";

export interface Slice {
  label: string;
  value: number;
}
export interface CoursePopularity {
  title: string;
  enrolments: number;
  completions: number;
}
export interface PlatformAnalytics {
  tierMix: Slice[];
  addOns: { forms: number; recruitment: number; observations: number };
  subStatus: Slice[];
  payingOrgs: number;
  /** Monthly recurring revenue estimate in GBP, or null if tier prices unset. */
  mrr: number | null;
  coursePopularity: CoursePopularity[];
  completionsByMonth: Slice[];
  totals: {
    orgs: number;
    learners: number;
    certificates: number;
    assessments: number;
    passRate: number;
  };
}

interface JoinedCourse {
  title?: string;
}

/** Platform-wide analytics for the superadmin (RLS returns all orgs). */
export async function loadPlatformAnalytics(
  supabase: SupabaseClient,
): Promise<PlatformAnalytics> {
  const [
    { data: orgs },
    { data: learners, count: learnerCount },
    { data: enrolments },
    { data: certs },
    { data: attempts },
    { data: courses },
  ] = await Promise.all([
    supabase
      .from("organisations")
      .select(
        "package_tier, status, subscription_status, forms_enabled, recruitment_enabled, observations_enabled, stripe_subscription_id",
      ),
    supabase
      .from("users")
      .select("id", { count: "exact" })
      .eq("role", "learner"),
    supabase.from("enrolments").select("course_id"),
    supabase.from("certificates").select("course_id, issued_at"),
    supabase
      .from("quiz_attempts")
      .select("passed")
      .not("submitted_at", "is", null),
    supabase.from("courses").select("id, title"),
  ]);

  const orgRows = orgs ?? [];

  // Tier mix + add-ons + subscription status + MRR.
  const tierCount = new Map<PackageTier, number>();
  const subCount = new Map<string, number>();
  let forms = 0,
    recruitment = 0,
    observations = 0,
    payingOrgs = 0;
  let mrr = 0;
  const priced = pricingConfigured();
  for (const o of orgRows) {
    const tier = (o.package_tier ?? "core") as PackageTier;
    tierCount.set(tier, (tierCount.get(tier) ?? 0) + 1);
    if (o.forms_enabled) forms += 1;
    if (o.recruitment_enabled) recruitment += 1;
    if (o.observations_enabled) observations += 1;
    const sub = o.subscription_status ?? "none";
    subCount.set(sub, (subCount.get(sub) ?? 0) + 1);
    if (o.stripe_subscription_id) payingOrgs += 1;
    // MRR estimate: active (non-suspended) orgs at their tier's list price.
    if (o.status !== "suspended") {
      const price = tierMonthlyGbp(tier);
      if (price != null) mrr += price;
    }
  }

  const tierMix: Slice[] = PACKAGE_TIERS.map((t) => ({
    label: t.label,
    value: tierCount.get(t.value) ?? 0,
  }));
  const subStatus: Slice[] = [...subCount.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  // Course popularity: enrolments + completions per course, top 10 by enrolments.
  const titleById = new Map<string, string>();
  for (const c of courses ?? [])
    titleById.set(c.id, (c as unknown as JoinedCourse).title ?? "Course");
  const enrolByCourse = new Map<string, number>();
  for (const e of enrolments ?? [])
    enrolByCourse.set(e.course_id, (enrolByCourse.get(e.course_id) ?? 0) + 1);
  const compByCourse = new Map<string, number>();
  for (const c of certs ?? [])
    compByCourse.set(c.course_id, (compByCourse.get(c.course_id) ?? 0) + 1);
  const coursePopularity: CoursePopularity[] = [...enrolByCourse.entries()]
    .map(([id, enrolments]) => ({
      title: titleById.get(id) ?? "Course",
      enrolments,
      completions: compByCourse.get(id) ?? 0,
    }))
    .sort((a, b) => b.enrolments - a.enrolments)
    .slice(0, 10);

  // Growth: completions per month over the last 6 months (oldest → newest).
  const MONTHS = 6;
  const now = new Date();
  const buckets = new Array(MONTHS).fill(0);
  const labels: string[] = [];
  for (let i = 0; i < MONTHS; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - (MONTHS - 1 - i), 1);
    labels.push(d.toLocaleDateString("en-GB", { month: "short" }));
  }
  const firstMonth = new Date(now.getFullYear(), now.getMonth() - (MONTHS - 1), 1);
  for (const c of certs ?? []) {
    const d = new Date(c.issued_at);
    if (d < firstMonth) continue;
    const idx =
      (d.getFullYear() - firstMonth.getFullYear()) * 12 +
      (d.getMonth() - firstMonth.getMonth());
    if (idx >= 0 && idx < MONTHS) buckets[idx] += 1;
  }
  const completionsByMonth: Slice[] = buckets.map((value, i) => ({
    label: labels[i],
    value,
  }));

  // Assessment pass rate.
  const submitted = attempts ?? [];
  const passed = submitted.filter((a) => a.passed).length;
  const passRate =
    submitted.length > 0 ? Math.round((passed / submitted.length) * 100) : 0;

  return {
    tierMix,
    addOns: { forms, recruitment, observations },
    subStatus,
    payingOrgs,
    mrr: priced ? mrr : null,
    coursePopularity,
    completionsByMonth,
    totals: {
      orgs: orgRows.length,
      learners: learnerCount ?? (learners ?? []).length,
      certificates: (certs ?? []).length,
      assessments: submitted.length,
      passRate,
    },
  };
}

/** Format a GBP amount with no decimals (e.g. £1,250). */
export function gbp(n: number): string {
  return `£${Math.round(n).toLocaleString("en-GB")}`;
}
