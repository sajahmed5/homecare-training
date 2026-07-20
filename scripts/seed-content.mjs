// Apply detailed content + topic-specific quiz banks to all 26 courses.
// Idempotent by slug: updates courses.content_blocks + description, and REPLACES
// each course's quiz_questions with the authored bank. Run with the service role:
//
//   node scripts/seed-content.mjs
//
// Note: this replaces the quiz bank for each course (removes the generic starter
// questions). Admins can add more questions in the platform question editor afterwards.

import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

// DESTRUCTIVE: this REPLACES each course's quiz_questions (deletes then inserts)
// and overwrites content_blocks with the pre-H5P authored blocks. Re-running it
// against the shared production DB wipes every quiz-bank expansion and reverts
// the interactive H5P courses. Require an explicit acknowledgement flag.
if (!process.argv.includes("--i-know-this-destroys-content")) {
  console.error(
    [
      "REFUSING TO RUN. seed-content.mjs deletes and replaces every course's quiz",
      "bank and overwrites content_blocks — it would wipe bank expansions and revert",
      "the H5P courses in the SHARED PRODUCTION database.",
      "",
      "If that is genuinely what you want, re-run with:",
      "  node scripts/seed-content.mjs --i-know-this-destroys-content",
    ].join("\n"),
  );
  process.exit(1);
}

import { careFundamentals } from "./content/care-fundamentals.mjs";
import { safeguarding } from "./content/safeguarding.mjs";
import { healthSafety } from "./content/health-safety.mjs";
import { infectionClinical } from "./content/infection-clinical.mjs";
import { governanceQuality } from "./content/governance-quality.mjs";

const MODULES = [
  ...careFundamentals,
  ...safeguarding,
  ...healthSafety,
  ...infectionClinical,
  ...governanceQuality,
];

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

let updated = 0;
const missing = [];

for (const m of MODULES) {
  const { data: course } = await admin
    .from("courses")
    .select("id")
    .eq("slug", m.slug)
    .maybeSingle();
  if (!course) {
    missing.push(m.slug);
    continue;
  }

  const { error: cErr } = await admin
    .from("courses")
    .update({ content_blocks: m.blocks, description: m.description })
    .eq("id", course.id);
  if (cErr) throw cErr;

  await admin.from("quiz_questions").delete().eq("course_id", course.id);
  const rows = m.questions.map((q, i) => ({
    course_id: course.id,
    question: q.question,
    options: q.options,
    answer_index: q.answer_index,
    sort_order: i,
  }));
  const { error: qErr } = await admin.from("quiz_questions").insert(rows);
  if (qErr) throw qErr;

  updated += 1;
  console.log(
    `  ${m.slug.padEnd(34)} ${m.blocks.length} blocks · ${m.questions.length} questions`,
  );
}

console.log(`\nUpdated ${updated}/${MODULES.length} courses.`);
if (missing.length) {
  console.log("MISSING slugs (not found in catalogue):", missing.join(", "));
  process.exit(1);
}
console.log("Content seeded ✓");
