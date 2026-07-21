// Insert new courses that don't exist yet — additive and safe.
//
//   node scripts/seed-new-courses.mjs
//
// Unlike seed-catalogue.mjs, this NEVER touches an existing course. It inserts
// only rows whose slug is not already present, reading content_blocks from the
// committed scripts/blocks/<slug>.json snapshot. Safe to re-run.
//
// Deploy the page files first: this points the shared DB at pages that must
// already be live, so a fresh self-enrol cannot 404.
import { config } from "dotenv";
config({ path: ".env.local" });
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

// The three Care Certificate standards we had no course for. Descriptions carry
// the knowledge-only / employer-sign-off compliance line.
const NEW_COURSES = [
  {
    slug: "personal-development",
    topic: "Care Fundamentals",
    expiry_months: 24,
    description:
      "Care Certificate Standard 2 — reflective practice, supervision, appraisal and building your development plan. This covers the knowledge element only; your employer must also observe your competence at work and sign it off.",
  },
  {
    slug: "mental-health-and-dementia",
    topic: "Care Fundamentals",
    expiry_months: 24,
    description:
      "Care Certificate Standard 9 — awareness of mental health conditions and dementia, supporting people well, and recognising delirium. Knowledge element only; employer observation and sign-off are also required.",
  },
  {
    slug: "learning-disability-and-autism",
    topic: "Care Fundamentals",
    expiry_months: 24,
    description:
      "Care Certificate Standard 16 — awareness of learning disability and autism, reasonable adjustments and the law. This is awareness only and is NOT the Oliver McGowan Mandatory Training, which your employer must arrange separately.",
  },
  {
    slug: "fluids-and-nutrition",
    topic: "Care Fundamentals",
    expiry_months: 24,
    description:
      "Care Certificate Standard 8 — supporting people to have enough to eat and drink: hydration, malnutrition, swallowing difficulties and person-centred mealtime support. This covers the knowledge element only; your employer must also observe your competence at work and sign it off.",
  },
];

const { data: topics } = await sb.from("topics").select("id, title");
const topicId = (name) => topics.find((t) => t.title === name)?.id ?? null;

const { data: maxRow } = await sb
  .from("courses")
  .select("sort_order")
  .order("sort_order", { ascending: false })
  .limit(1);
let sortOrder = (maxRow?.[0]?.sort_order ?? 0) + 1;

let inserted = 0;
for (const c of NEW_COURSES) {
  const { data: existing } = await sb
    .from("courses")
    .select("id")
    .eq("slug", c.slug)
    .maybeSingle();
  if (existing) {
    console.log(`• ${c.slug} already exists — skipped`);
    continue;
  }

  const block = JSON.parse(readFileSync(`scripts/blocks/${c.slug}.json`, "utf8"));
  const { error } = await sb.from("courses").insert({
    topic_id: topicId(c.topic),
    title: block.title,
    slug: c.slug,
    description: c.description,
    content_blocks: block.content_blocks,
    expiry_months: c.expiry_months,
    sort_order: sortOrder++,
  });
  if (error) {
    console.error(`✗ ${c.slug}: ${error.message}`);
    continue;
  }
  console.log(`✓ inserted ${block.title} (${block.content_blocks.length} pages)`);
  inserted++;
}
console.log(`\nInserted ${inserted} new course(s).`);
