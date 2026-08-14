/**
 * Package tiers a platform admin can assign. Stripe wires these to flags in
 * Phase 9. Labels are the domiciliary-care package names (issue #10).
 */
export const PACKAGE_TIERS = [
  { value: "core", label: "Starter" },
  { value: "core_forms", label: "Growth" },
  { value: "core_recruitment", label: "Business" },
  { value: "full", label: "Enterprise" },
] as const;

export type PackageTier = (typeof PACKAGE_TIERS)[number]["value"];

export function tierLabel(value: string): string {
  return PACKAGE_TIERS.find((t) => t.value === value)?.label ?? value;
}

/**
 * What each package includes, shown on the org Account page. Drafted from
 * what each tier actually enables — awaiting the official package sheet.
 */
export const TIER_DETAILS: Record<
  PackageTier,
  { tagline: string; features: string[] }
> = {
  core: {
    tagline: "Everything a care team needs to train and stay compliant.",
    features: [
      "Full CQC-aligned course library",
      "Unlimited learners and admin users",
      "Certificates with verification and expiry tracking",
      "Training matrix and CSV exports",
      "Automated reminders and weekly digest emails",
    ],
  },
  core_forms: {
    tagline: "Training plus your own digital paperwork.",
    features: [
      "Everything in Starter",
      "Forms builder — custom forms with e-signatures",
      "Form submissions tracked per staff member",
    ],
  },
  core_recruitment: {
    tagline: "Training plus recruitment compliance.",
    features: [
      "Everything in Starter",
      "Recruitment tracker — candidates and interviews",
      "Document checklist with DBS and right-to-work expiry dates",
    ],
  },
  full: {
    tagline: "The complete platform for growing care providers.",
    features: [
      "Everything in Starter, Growth and Business",
      "Forms builder with e-signatures",
      "Recruitment tracker with document expiry alerts",
      "Care Certificate workplace assessment",
      "Priority support",
    ],
  },
};

export const ORG_STATUSES = [
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
] as const;

export type OrgStatus = (typeof ORG_STATUSES)[number]["value"];
