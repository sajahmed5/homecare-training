// Point a course's content_blocks at a committed block file.
//
//   node scripts/set-course-blocks.mjs <slug> [blocks.json]
//
// content_blocks lives in the shared production database, so it drifts from the
// repo unless something writes it back deliberately. This is that something:
// the single supported way to update a course's page order, labels, gating
// counts and sections from a file under version control.
//
// The block file defaults to scripts/blocks/<slug>.json (the snapshot format:
// { slug, title, content_blocks:[...] }) but a bare array is accepted too.
//
// SAFETY: the DB is shared with production. Every page path referenced by the
// blocks MUST already exist on disk AND be committed, or a learner hits a 404
// mid-course. This script refuses to run if any referenced page is missing or
// untracked — deploy the files first, then run this.
import { config } from "dotenv";
config({ path: ".env.local" });
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

const slug = process.argv[2];
if (!slug) {
  console.error("Usage: node scripts/set-course-blocks.mjs <slug> [blocks.json]");
  process.exit(1);
}
const blockPath = process.argv[3] ?? join("scripts/blocks", `${slug}.json`);
if (!existsSync(blockPath)) {
  console.error(`Block file not found: ${blockPath}`);
  process.exit(1);
}

const raw = JSON.parse(readFileSync(blockPath, "utf8"));
const blocks = Array.isArray(raw) ? raw : raw.content_blocks;
if (!Array.isArray(blocks) || blocks.length === 0) {
  console.error(`${blockPath} has no content_blocks array`);
  process.exit(1);
}

// Files git knows about — an untracked page is local-only and 404s for everyone.
const tracked = new Set(
  execSync("git ls-files public/h5p/content", { encoding: "utf8" })
    .split("\n")
    .filter(Boolean),
);

const problems = [];
for (const [i, b] of blocks.entries()) {
  if (b.type !== "h5p") continue;
  if (!b.path) {
    problems.push(`block ${i + 1} has no path`);
    continue;
  }
  const dir = join("public/h5p/content", b.path);
  for (const f of [join(dir, "h5p.json"), join(dir, "content", "content.json")]) {
    if (!existsSync(f)) problems.push(`${b.path}: ${f} missing on disk`);
    else if (!tracked.has(f)) problems.push(`${b.path}: ${f} NOT committed to git`);
  }
}
if (problems.length) {
  console.error("Refusing to update the shared DB — pages missing or uncommitted:");
  problems.forEach((p) => console.error("  " + p));
  console.error("\nCommit and deploy the page files first, then re-run.");
  process.exit(1);
}

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);
const { data, error } = await sb
  .from("courses")
  .update({ content_blocks: blocks })
  .eq("slug", slug)
  .select("id, title");
if (error) {
  console.error("Update failed:", error.message);
  process.exit(1);
}
if (!data.length) {
  console.error(`No course with slug "${slug}"`);
  process.exit(1);
}
const sections = [...new Set(blocks.map((b) => b.section).filter(Boolean))];
console.log(
  `✓ ${data[0].title}: ${blocks.length} pages, ${sections.length} section(s) -> DB`,
);
