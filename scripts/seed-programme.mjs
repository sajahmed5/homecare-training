// Seed the Care Certificate programme — one pathway (kind 'programme') plus a
// pathway_courses row per standard, numbered and labelled.
//
//   node scripts/seed-programme.mjs
//
// Idempotent: upserts the pathway by slug and each link by (pathway_id,
// course_id). Touches ONLY pathways / pathway_courses — never courses. Run it
// after the 20260721090000_programmes.sql migration is applied.
import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const PROGRAMME = {
  slug: "care-certificate",
  title: "The Care Certificate",
  summary:
    "The Care Certificate is the agreed set of standards every new health and social care worker in England should meet. Work through all 16 standards below at your own pace — you can start any standard, in any order.",
  compliance_note:
    "My Care Academy e-learning covers the knowledge element of the Care Certificate. Achieving the Care Certificate also requires your competence to be observed and assessed in real work by your employer. Your employer awards and signs off the Care Certificate — My Care Academy cannot. E-learning alone does not complete it.",
  sort_order: 1,
};

// Standard number -> official 2025 name -> the course slug that delivers it.
const STANDARDS = [
  [1, "Understand your role", "introduction-to-care"],
  [2, "Your personal development", "personal-development"],
  [3, "Duty of care", "duty-of-care"],
  [4, "Equality, diversity, inclusion and human rights", "equality-diversity-and-inclusion"],
  [5, "Work in a person-centred way", "person-centred-care"],
  [6, "Communication", "communication-skills"],
  [7, "Privacy and dignity", "privacy-and-dignity"],
  [8, "Fluids and nutrition", "food-hygiene-and-nutrition"],
  [9, "Awareness of mental health and dementia", "mental-health-and-dementia"],
  [10, "Adult safeguarding", "safeguarding-adults-level-2"],
  [11, "Safeguarding children", "safeguarding-children"],
  [12, "Basic life support", "basic-life-support-bls"],
  [13, "Health and safety", "health-and-safety"],
  [14, "Handling information", "record-keeping-and-documentation"],
  [15, "Infection prevention and control", "infection-prevention-and-control"],
  [16, "Awareness of learning disability and autism", "learning-disability-and-autism"],
];

// Upsert the programme pathway.
const { data: pathway, error: pErr } = await sb
  .from("pathways")
  .upsert(
    {
      slug: PROGRAMME.slug,
      title: PROGRAMME.title,
      kind: "programme",
      summary: PROGRAMME.summary,
      compliance_note: PROGRAMME.compliance_note,
      sort_order: PROGRAMME.sort_order,
    },
    { onConflict: "slug" },
  )
  .select("id")
  .single();
if (pErr) {
  console.error("Programme upsert failed:", pErr.message);
  process.exit(1);
}

// Resolve course ids by slug.
const { data: courses } = await sb.from("courses").select("id, slug");
const idFor = (slug) => courses.find((c) => c.slug === slug)?.id ?? null;

const links = [];
const missing = [];
for (const [no, name, slug] of STANDARDS) {
  const courseId = idFor(slug);
  if (!courseId) {
    missing.push(`Standard ${no} -> ${slug}`);
    continue;
  }
  links.push({
    pathway_id: pathway.id,
    course_id: courseId,
    standard_no: no,
    label: `Standard ${no} — ${name}`,
    sort_order: no,
  });
}

if (missing.length) {
  console.error("Missing courses for:");
  missing.forEach((m) => console.error("  " + m));
  process.exit(1);
}

const { error: lErr } = await sb
  .from("pathway_courses")
  .upsert(links, { onConflict: "pathway_id,course_id" });
if (lErr) {
  console.error("Links upsert failed:", lErr.message);
  process.exit(1);
}

console.log(`✓ Programme "${PROGRAMME.title}" seeded with ${links.length} standards.`);
