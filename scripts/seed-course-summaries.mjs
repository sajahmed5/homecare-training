// Write each course's summary recap into courses.summary from the committed
// scripts/summaries/<slug>.json snapshots. Additive and idempotent — updates
// only the summary column, matched by slug.
//
//   node scripts/seed-course-summaries.mjs [<slug> ...]   (all if none given)
//
// Snapshot shape: { "slug": "...", "intro": "...", "points": ["...", ...] }
// Stored as JSON text: { "intro": string, "points": string[] }.
import { config } from "dotenv";
config({ path: ".env.local" });
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const DIR = "scripts/summaries";
const args = process.argv.slice(2);
const slugs = args.length
  ? args
  : readdirSync(DIR).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, ""));

let updated = 0;
for (const slug of slugs) {
  const path = join(DIR, `${slug}.json`);
  if (!existsSync(path)) { console.error(`✗ ${slug}: no ${path}`); continue; }
  const s = JSON.parse(readFileSync(path, "utf8"));
  if (!Array.isArray(s.points) || s.points.length === 0) {
    console.error(`✗ ${slug}: no points`); continue;
  }
  const value = JSON.stringify({ intro: String(s.intro ?? ""), points: s.points.map(String) });
  const { data, error } = await sb
    .from("courses")
    .update({ summary: value })
    .eq("slug", slug)
    .select("id");
  if (error) { console.error(`✗ ${slug}: ${error.message}`); continue; }
  if (!data?.length) { console.error(`✗ ${slug}: no course with that slug`); continue; }
  console.log(`✓ ${slug}: ${s.points.length} points`);
  updated++;
}
console.log(`\nUpdated ${updated}/${slugs.length} course summaries.`);
