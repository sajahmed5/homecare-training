/**
 * The Care Certificate standards, and the course that covers each one.
 *
 * The Care Certificate has 15 standards. We add a sixteenth on learning
 * disability and autism, because since the Health and Care Act 2022 providers
 * are expected to train staff on it (the Oliver McGowan requirement), and a
 * new starter induction that skips it is incomplete.
 *
 * Mirrors the care-certificate pathway in the database (pathway_courses
 * .standard_no), so the marketing page can't drift from what we deliver.
 */
export interface CareCertStandard {
  no: number;
  name: string;
  course: string;
  /** Not one of the official 15. */
  extra?: true;
}

export const CARE_CERT_STANDARDS: CareCertStandard[] = [
  { no: 1, name: "Understand your role", course: "Introduction to Care" },
  { no: 2, name: "Your personal development", course: "Your Personal Development" },
  { no: 3, name: "Duty of care", course: "Duty of Care" },
  { no: 4, name: "Equality, diversity, inclusion and human rights", course: "Equality, Diversity & Inclusion" },
  { no: 5, name: "Work in a person-centred way", course: "Person-Centred Care" },
  { no: 6, name: "Communication", course: "Communication Skills" },
  { no: 7, name: "Privacy and dignity", course: "Privacy & Dignity" },
  { no: 8, name: "Fluids and nutrition", course: "Fluids and Nutrition" },
  { no: 9, name: "Awareness of mental health and dementia", course: "Awareness of Mental Health and Dementia" },
  { no: 10, name: "Adult safeguarding", course: "Safeguarding Adults Level 2" },
  { no: 11, name: "Safeguarding children", course: "Safeguarding Children" },
  { no: 12, name: "Basic life support", course: "Basic Life Support (BLS)" },
  { no: 13, name: "Health and safety", course: "Health & Safety" },
  { no: 14, name: "Handling information", course: "Record Keeping & Documentation" },
  { no: 15, name: "Infection prevention and control", course: "Infection Prevention & Control" },
  { no: 16, name: "Awareness of learning disability and autism", course: "Awareness of Learning Disability and Autism", extra: true },
];

export const OFFICIAL_STANDARDS = CARE_CERT_STANDARDS.filter((s) => !s.extra).length;
