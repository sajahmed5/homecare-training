// Replace a course's assessment question bank from a JSON spec.
//
//   node scripts/seed-quiz-bank.mjs <bank.json>
//
// Spec:
// {
//   "courseTitle": "Fire Safety",
//   "questions": [
//     { "type":"mcq", "question":"...", "options":["a","b","c","d"], "answer_index":0 },
//     { "type":"true_false", "question":"...", "options":["True","False"], "answer_index":0 },
//     { "type":"multi", "question":"...", "options":[...], "payload":{"correctIndices":[0,2]} },
//     { "type":"fill_blank", "question":"The fridge is ___ or below.", "payload":{"blanks":[{"answers":["5","five"]}]} },
//     { "type":"hotspot", "question":"Click the hazards", "payload":{"image":"/quiz/scenes/x.svg","zones":[{"id":1,"x":10,"y":10,"w":8,"h":12,"correct":true,"label":"..."}]} }
//   ]
// }
import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const specPath = process.argv[2];
if (!specPath) { console.error("Usage: node scripts/seed-quiz-bank.mjs <bank.json>"); process.exit(1); }
const spec = JSON.parse(readFileSync(specPath, "utf8"));

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const { data: course, error: cErr } = await admin
  .from("courses").select("id").eq("title", spec.courseTitle).single();
if (cErr || !course) { console.error(`Course not found: ${spec.courseTitle}`); process.exit(1); }

// Basic validation so we never seed an ungradeable question.
const ALLOWED = ["mcq", "multi", "true_false", "fill_blank", "hotspot"];
let bad = 0;
spec.questions.forEach((q, i) => {
  if (!ALLOWED.includes(q.type)) { console.error(`Q${i + 1}: bad type ${q.type}`); bad++; }
  if ((q.type === "mcq" || q.type === "true_false") && (typeof q.answer_index !== "number" || !Array.isArray(q.options))) { console.error(`Q${i + 1}: mcq/true_false needs options + answer_index`); bad++; }
  if (q.type === "multi" && !(q.payload?.correctIndices?.length)) { console.error(`Q${i + 1}: multi needs payload.correctIndices`); bad++; }
  if (q.type === "fill_blank") {
    const blanks = q.payload?.blanks?.length ?? 0;
    const markers = (q.question.match(/_{2,}/g) || []).length;
    if (!blanks || blanks !== markers) { console.error(`Q${i + 1}: fill_blank blanks(${blanks}) must match ___ markers(${markers})`); bad++; }
  }
  if (q.type === "hotspot" && !(q.payload?.image && q.payload?.zones?.some((z) => z.correct))) { console.error(`Q${i + 1}: hotspot needs image + at least one correct zone`); bad++; }
});
if (bad) { console.error(`\n${bad} invalid question(s) — aborting.`); process.exit(1); }

// Replace the bank.
await admin.from("quiz_questions").delete().eq("course_id", course.id);
const rows = spec.questions.map((q, i) => ({
  course_id: course.id,
  type: q.type,
  question: q.question,
  options: q.options ?? null,
  answer_index: typeof q.answer_index === "number" ? q.answer_index : null,
  payload: q.payload ?? null,
  sort_order: i,
}));
const { error: iErr } = await admin.from("quiz_questions").insert(rows);
if (iErr) { console.error("Insert failed:", iErr.message); process.exit(1); }

const byType = rows.reduce((m, r) => ((m[r.type] = (m[r.type] || 0) + 1), m), {});
console.log(`Seeded ${rows.length} questions for "${spec.courseTitle}":`, JSON.stringify(byType));
