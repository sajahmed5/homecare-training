// Compute a realistic per-course duration and write it to courses.estimated_minutes.
//
//   node scripts/compute-durations.mjs [<slug> ...]   (all courses if none given)
//
// The estimate is derived from each course's actual content: reading time of the
// AdvancedText panels (~200 words/minute) plus a little for each in-content
// question. Re-runnable and idempotent — it only reads content files + writes the
// one column. Splitting pages doesn't change words or questions, so the value is
// stable across a repagination.
import { config } from "dotenv";
config({ path: ".env.local" });
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const CONTENT = "public/h5p/content";
const WPM = 200; // careful reading speed for compliance content
const MIN_PER_QUESTION = 0.75;
const QUESTION_LIB = /^H5P\.(MultiChoice|TrueFalse|DragText|Blanks|MarkTheWords)/;

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const wordCount = (html) =>
  String(html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .split(/\s+/)
    .filter(Boolean).length;

/** Sum words + questions across a course's pages (from its content_blocks). */
function measure(blocks) {
  let words = 0;
  let questions = 0;
  for (const b of blocks) {
    if (b?.type !== "h5p" || !b.path) continue;
    const file = join(CONTENT, b.path, "content", "content.json");
    if (!existsSync(file)) continue;
    let doc;
    try {
      doc = JSON.parse(readFileSync(file, "utf8"));
    } catch {
      continue;
    }
    for (const panel of doc.content ?? []) {
      const lib = panel?.content?.library ?? "";
      const params = panel?.content?.params ?? {};
      if (lib.startsWith("H5P.AdvancedText")) words += wordCount(params.text);
      else if (QUESTION_LIB.test(lib)) questions += 1;
    }
  }
  return { words, questions };
}

const args = process.argv.slice(2);
let query = sb.from("courses").select("id, slug, title, content_blocks");
if (args.length) query = query.in("slug", args);
const { data: courses, error } = await query;
if (error) {
  console.error("Failed to load courses:", error.message);
  process.exit(1);
}

let updated = 0;
for (const c of courses) {
  const blocks = Array.isArray(c.content_blocks) ? c.content_blocks : [];
  const { words, questions } = measure(blocks);
  const minutes = clamp(
    Math.round(words / WPM + questions * MIN_PER_QUESTION),
    8,
    60,
  );
  const { error: upErr } = await sb
    .from("courses")
    .update({ estimated_minutes: minutes })
    .eq("id", c.id);
  if (upErr) {
    console.error(`✗ ${c.slug}: ${upErr.message}`);
    continue;
  }
  console.log(`✓ ${c.slug}: ${minutes} min  (${words} words, ${questions} questions)`);
  updated++;
}
console.log(`\nUpdated ${updated}/${courses.length} course durations.`);
