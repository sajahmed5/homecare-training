// Dump a per-course context pack for question authoring: existing question
// stems (to avoid overlap) + the page prose (to ground new questions).
// Writes scripts/quiz-banks/.context/<slug>.md for each course.
import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const outDir = "scripts/quiz-banks/.context";
mkdirSync(outDir, { recursive: true });

function unesc(s) {
  return s.replace(/&mdash;/g, "—").replace(/&rsquo;/g, "’").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&nbsp;/g, " ");
}
const strip = (h) => unesc(h.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();

const { data: courses } = await admin.from("courses").select("id, slug, title").order("slug");
for (const c of courses) {
  const { data: qs } = await admin.from("quiz_questions").select("question, sort_order").eq("course_id", c.id).order("sort_order");
  const snapPath = join("scripts/blocks", `${c.slug}.json`);
  const blocks = existsSync(snapPath) ? JSON.parse(readFileSync(snapPath, "utf8")).content_blocks : [];
  let prose = "";
  for (const b of blocks) {
    const cp = join("public/h5p/content", b.path, "content", "content.json");
    if (!existsSync(cp)) continue;
    const doc = JSON.parse(readFileSync(cp, "utf8"));
    const items = Array.isArray(doc.content) ? doc.content : [];
    for (const it of items) {
      const html = it?.content?.params?.text;
      if (typeof html === "string") prose += strip(html) + "\n\n";
    }
  }
  const md = `# ${c.title} (${c.slug})\n\n## Existing questions — DO NOT duplicate or lightly reword these ${(qs || []).length}:\n${(qs || []).map((q, i) => `${i + 1}. ${q.question}`).join("\n")}\n\n## Course material (author your new questions strictly from this):\n\n${prose}`;
  writeFileSync(join(outDir, `${c.slug}.md`), md);
  console.log(`${c.slug}: ${(qs || []).length} existing Qs, ${prose.split(/\s+/).length} words of prose`);
}
