// Final DB-side integrity check: every quiz_question must be gradeable by
// lib/quiz.ts, and no course should have duplicate stems.
import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const norm = (s) => String(s ?? "").trim().toLowerCase().replace(/\s+/g, " ");

const { data: courses } = await admin.from("courses").select("id, slug").order("slug");
let problems = 0, total = 0, under45 = 0;
for (const c of courses) {
  const { data: qs } = await admin.from("quiz_questions").select("type, question, options, answer_index, payload").eq("course_id", c.id);
  total += qs.length;
  if (qs.length < 45) { under45++; console.log(`  under target: ${c.slug} has ${qs.length}`); }
  const seen = new Set();
  for (const q of qs) {
    const k = norm(q.question);
    if (seen.has(k)) { console.log(`  DUP stem ${c.slug}: ${q.question.slice(0, 50)}`); problems++; }
    seen.add(k);
    const t = q.type;
    if (t === "mcq" || t === "true_false") {
      if (!Array.isArray(q.options) || typeof q.answer_index !== "number" || q.answer_index < 0 || q.answer_index >= q.options.length) { console.log(`  UNGRADEABLE ${c.slug} (${t}): ${q.question.slice(0, 40)}`); problems++; }
    } else if (t === "multi") {
      const ci = q.payload?.correctIndices;
      if (!Array.isArray(ci) || !ci.length || ci.some((i) => i < 0 || i >= (q.options?.length ?? 0))) { console.log(`  UNGRADEABLE ${c.slug} (multi): ${q.question.slice(0, 40)}`); problems++; }
    } else if (t === "fill_blank") {
      const blanks = q.payload?.blanks?.length ?? 0;
      const markers = (q.question.match(/_{2,}/g) || []).length;
      if (!blanks || blanks !== markers || q.payload.blanks.some((b) => !(b.answers?.length))) { console.log(`  UNGRADEABLE ${c.slug} (fill_blank): ${q.question.slice(0, 40)}`); problems++; }
    } else if (t === "hotspot") {
      if (!(q.payload?.image && q.payload?.zones?.some((z) => z.correct))) { console.log(`  UNGRADEABLE ${c.slug} (hotspot)`); problems++; }
    } else { console.log(`  BAD TYPE ${c.slug}: ${t}`); problems++; }
  }
}
console.log(`\n${courses.length} courses, ${total} questions, ${(total / courses.length).toFixed(1)} avg`);
console.log(`under-45 courses: ${under45}, integrity problems: ${problems}`);
