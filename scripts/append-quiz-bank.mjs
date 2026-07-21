// Additively grow a course's assessment bank from a JSON spec. Unlike
// seed-quiz-bank.mjs (which REPLACES the bank), this only ever inserts, and
// skips any incoming question whose text already exists — so it is safe to
// re-run and never wipes questions edited in the platform console.
//
//   node scripts/append-quiz-bank.mjs scripts/quiz-banks/<slug>.add.json
//
// Spec: { "slug": "fire-safety", "questions": [ <question>, ... ] }
//   (or "courseTitle" instead of "slug")
// Question shapes match seed-quiz-bank.mjs:
//   { "type":"mcq",        "question":"…", "options":[…], "answer_index":0 }
//   { "type":"true_false", "question":"…", "options":["True","False"], "answer_index":0 }
//   { "type":"multi",      "question":"…", "options":[…], "payload":{"correctIndices":[0,2]} }
//   { "type":"fill_blank", "question":"… ___ …", "payload":{"blanks":[{"answers":["…"]}]} }
import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const specPath = process.argv[2];
if (!specPath) {
  console.error("Usage: node scripts/append-quiz-bank.mjs <bank.add.json>");
  process.exit(1);
}
const spec = JSON.parse(readFileSync(specPath, "utf8"));

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

// Resolve the course by slug (preferred) or title.
let query = admin.from("courses").select("id, title, slug");
query = spec.slug ? query.eq("slug", spec.slug) : query.eq("title", spec.courseTitle);
const { data: course, error: cErr } = await query.single();
if (cErr || !course) {
  console.error(`Course not found: ${spec.slug ?? spec.courseTitle}`);
  process.exit(1);
}

// Validate — mirror seed-quiz-bank.mjs so we never insert an ungradeable item.
const ALLOWED = ["mcq", "multi", "true_false", "fill_blank", "hotspot"];
let bad = 0;
spec.questions.forEach((q, i) => {
  if (!ALLOWED.includes(q.type)) { console.error(`Q${i + 1}: bad type ${q.type}`); bad++; }
  if ((q.type === "mcq" || q.type === "true_false") && (typeof q.answer_index !== "number" || !Array.isArray(q.options))) { console.error(`Q${i + 1}: mcq/true_false needs options + answer_index`); bad++; }
  if ((q.type === "mcq" || q.type === "true_false") && Array.isArray(q.options) && (q.answer_index < 0 || q.answer_index >= q.options.length)) { console.error(`Q${i + 1}: answer_index out of range`); bad++; }
  if (q.type === "multi" && !(q.payload?.correctIndices?.length)) { console.error(`Q${i + 1}: multi needs payload.correctIndices`); bad++; }
  if (q.type === "fill_blank") {
    const blanks = q.payload?.blanks?.length ?? 0;
    const markers = (q.question.match(/_{2,}/g) || []).length;
    if (!blanks || blanks !== markers) { console.error(`Q${i + 1}: fill_blank blanks(${blanks}) must match ___ markers(${markers})`); bad++; }
  }
  if (q.type === "hotspot" && !(q.payload?.image && q.payload?.zones?.some((z) => z.correct))) { console.error(`Q${i + 1}: hotspot needs image + at least one correct zone`); bad++; }
});
if (bad) { console.error(`\n${bad} invalid question(s) — aborting.`); process.exit(1); }

// Existing bank: for dedupe (by normalised text) and for the next sort_order.
const { data: existing, error: eErr } = await admin
  .from("quiz_questions").select("question, sort_order").eq("course_id", course.id);
if (eErr) { console.error("Read existing failed:", eErr.message); process.exit(1); }
const norm = (s) => String(s ?? "").trim().toLowerCase().replace(/\s+/g, " ");
const seen = new Set((existing ?? []).map((r) => norm(r.question)));
let nextOrder = (existing ?? []).reduce((m, r) => Math.max(m, r.sort_order ?? 0), -1) + 1;

// Keep only genuinely new questions (also dedupe within the spec itself).
const fresh = [];
let dupes = 0;
for (const q of spec.questions) {
  const key = norm(q.question);
  if (seen.has(key)) { dupes++; continue; }
  seen.add(key);
  fresh.push(q);
}

if (!fresh.length) {
  console.log(`${course.slug}: nothing to add (${dupes} duplicate(s) skipped, bank stays at ${existing?.length ?? 0}).`);
  process.exit(0);
}

const rows = fresh.map((q, i) => ({
  course_id: course.id,
  type: q.type,
  question: q.question,
  options: q.options ?? null,
  answer_index: typeof q.answer_index === "number" ? q.answer_index : null,
  payload: q.payload ?? null,
  sort_order: nextOrder + i,
}));
const { error: iErr } = await admin.from("quiz_questions").insert(rows);
if (iErr) { console.error("Insert failed:", iErr.message); process.exit(1); }

const before = existing?.length ?? 0;
const byType = rows.reduce((m, r) => ((m[r.type] = (m[r.type] || 0) + 1), m), {});
console.log(`✓ ${course.slug}: +${rows.length} (${dupes} dup skipped) -> ${before + rows.length} total ${JSON.stringify(byType)}`);
