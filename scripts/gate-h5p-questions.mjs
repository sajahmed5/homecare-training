// Backfill the `questions` count on every H5P course's content_blocks by
// reading each page's content.json and counting gradeable interactions
// (MultiChoice / DragText / TrueFalse). The player gates "Next" on this.
//
//   node scripts/gate-h5p-questions.mjs
import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const GRADEABLE = ["H5P.MultiChoice", "H5P.DragText", "H5P.TrueFalse"];
const CONTENT = join(process.cwd(), "public/h5p/content");

function countQuestions(pagePath) {
  const file = join(CONTENT, pagePath, "content", "content.json");
  if (!existsSync(file)) return 0;
  const json = JSON.parse(readFileSync(file, "utf8"));
  const panels = json.content ?? [];
  return panels.filter((p) => {
    const lib = (p.content?.library ?? "").split(" ")[0];
    return GRADEABLE.includes(lib);
  }).length;
}

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const { data: courses, error } = await admin.from("courses").select("id, title, content_blocks");
if (error) { console.error(error.message); process.exit(1); }

let updated = 0;
for (const c of courses ?? []) {
  const blocks = c.content_blocks;
  if (!Array.isArray(blocks) || blocks.length === 0 || !blocks.every((b) => b?.type === "h5p")) continue;
  const next = blocks.map((b) => ({ ...b, questions: countQuestions(b.path) }));
  const total = next.reduce((n, b) => n + b.questions, 0);
  const { error: e } = await admin.from("courses").update({ content_blocks: next }).eq("id", c.id);
  if (e) { console.error(c.title, e.message); continue; }
  updated++;
  console.log(`${c.title}: ${next.length} pages, ${total} questions gated`);
}
console.log(`\nUpdated ${updated} H5P course(s).`);
