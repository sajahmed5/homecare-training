// Set the Care Certificate knowledge-only footer note on the 16 standard
// courses, so their certificate PDFs never read as "the Care Certificate,
// awarded by My Care Academy". Idempotent. Run after the programmes migration.
//
//   node scripts/set-certificate-notes.mjs
import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const NOTE =
  "This certifies completion of the knowledge assessment only. Full achievement of the Care Certificate also requires your workplace competence to be observed and signed off by your employer.";

const SLUGS = [
  "introduction-to-care",
  "personal-development",
  "duty-of-care",
  "equality-diversity-and-inclusion",
  "person-centred-care",
  "communication-skills",
  "privacy-and-dignity",
  "food-hygiene-and-nutrition",
  "mental-health-and-dementia",
  "safeguarding-adults-level-2",
  "safeguarding-children",
  "basic-life-support-bls",
  "health-and-safety",
  "record-keeping-and-documentation",
  "infection-prevention-and-control",
  "learning-disability-and-autism",
];

const { data, error } = await sb
  .from("courses")
  .update({ certificate_note: NOTE })
  .in("slug", SLUGS)
  .select("slug");
if (error) {
  console.error("Update failed:", error.message);
  process.exit(1);
}
console.log(`✓ certificate note set on ${data.length} Care Certificate standard courses.`);
