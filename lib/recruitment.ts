export interface RequiredDoc {
  key: string;
  label: string;
  tracksExpiry?: boolean;
}

/** The document checklist shown as columns in the recruitment tracker. */
export const REQUIRED_DOCS: RequiredDoc[] = [
  { key: "application", label: "Application Form" },
  { key: "proof_id", label: "Proof of ID" },
  { key: "right_to_work", label: "Right to Work", tracksExpiry: true },
  { key: "proof_ni", label: "Proof of NI" },
  { key: "proof_address", label: "Proof of Address" },
  { key: "references", label: "References" },
  { key: "literacy", label: "Literacy Test" },
  { key: "interview", label: "Interview" },
  { key: "dbs", label: "DBS", tracksExpiry: true },
  { key: "role_acceptance", label: "Role Acceptance" },
  { key: "contract", label: "Contract" },
  { key: "training", label: "Training" },
];

export function docLabel(key: string): string {
  return REQUIRED_DOCS.find((d) => d.key === key)?.label ?? key;
}

export const CANDIDATE_STAGES = [
  "Applied",
  "Screening",
  "Interview",
  "Offer",
  "Onboarding",
] as const;

export const CANDIDATE_STATUSES = ["candidate", "hired", "rejected"] as const;
