/** Package tiers a platform admin can assign. Stripe wires these to flags in Phase 9. */
export const PACKAGE_TIERS = [
  { value: "core", label: "Core" },
  { value: "core_forms", label: "Core + Forms" },
  { value: "core_recruitment", label: "Core + Recruitment" },
  { value: "full", label: "Full" },
] as const;

export type PackageTier = (typeof PACKAGE_TIERS)[number]["value"];

export function tierLabel(value: string): string {
  return PACKAGE_TIERS.find((t) => t.value === value)?.label ?? value;
}

export const ORG_STATUSES = [
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
] as const;

export type OrgStatus = (typeof ORG_STATUSES)[number]["value"];
