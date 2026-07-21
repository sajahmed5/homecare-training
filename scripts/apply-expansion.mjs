// Apply a Phase-3 course expansion spec: build the new pages and write the
// full content_blocks snapshot. Handles both modes:
//
//   node scripts/apply-expansion.mjs scripts/specs/expansion/<slug>.json
//
// mode "rebuild": spec.pages is the complete new course. Built under a temp
//   slug, then the live dir is replaced. Block file = all pages with sections.
// mode "append": spec.newPages become p9.. on the existing course; spec.order
//   lists every page (existing + new) in reading order with its section. The
//   block file merges existing metadata (from scripts/blocks/<slug>.json) with
//   the newly built pages.
//
// Never runs --set-db and never rmSyncs a live dir directly — the builder only
// ever targets a temp slug. Deploy the files, THEN run set-course-blocks.mjs.
import { readFileSync, writeFileSync, existsSync, rmSync, renameSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";

const specPath = process.argv[2];
if (!specPath) {
  console.error("Usage: node scripts/apply-expansion.mjs <spec.json>");
  process.exit(1);
}
const spec = JSON.parse(readFileSync(specPath, "utf8"));
const slug = spec.slug;
const CONTENT = "public/h5p/content";
const existingSnap = JSON.parse(
  readFileSync(join("scripts/blocks", `${slug}.json`), "utf8"),
);
const courseTitle = spec.courseTitle ?? existingSnap.title;

// Build a set of pages under a temp slug and return its BLOCKS_JSON array.
function buildTemp(tempSlug, pages) {
  const tmpSpec = join("scripts/specs/expansion", `.build-${tempSlug}.json`);
  writeFileSync(tmpSpec, JSON.stringify({ slug: tempSlug, courseTitle, pages }));
  const out = execSync(`node scripts/build-h5p-course.mjs ${tmpSpec}`, {
    encoding: "utf8",
  });
  rmSync(tmpSpec, { force: true });
  const line = out.split("\n").find((l) => l.startsWith("BLOCKS_JSON="));
  if (!line) throw new Error("builder produced no BLOCKS_JSON");
  return JSON.parse(line.slice("BLOCKS_JSON=".length));
}

let blocks;

if (spec.mode === "rebuild") {
  const built = buildTemp(`${slug}-add`, spec.pages);
  // Replace the live directory with the freshly built temp one.
  rmSync(join(CONTENT, slug), { recursive: true, force: true });
  renameSync(join(CONTENT, `${slug}-add`), join(CONTENT, slug));
  // Blocks: point paths at the real slug, carry section from the spec pages.
  blocks = built.map((b, i) => ({
    type: "h5p",
    path: `${slug}/p${i + 1}`,
    label: b.label,
    questions: b.questions,
    section: spec.pages[i].section,
  }));
} else if (spec.mode === "append") {
  const N = existingSnap.content_blocks.length; // existing page count
  const built = buildTemp(`${slug}-add`, spec.newPages);
  // Move new pages onto the real course as p(N+1)..p(N+k).
  const tmpDir = join(CONTENT, `${slug}-add`);
  const newMeta = {}; // pN -> {label, questions}
  built.forEach((b, i) => {
    const src = join(tmpDir, `p${i + 1}`);
    const destPage = `p${N + 1 + i}`;
    renameSync(src, join(CONTENT, slug, destPage));
    newMeta[destPage] = { label: b.label, questions: b.questions };
  });
  rmSync(tmpDir, { recursive: true, force: true });

  // Existing page metadata by page id.
  const existMeta = {};
  for (const b of existingSnap.content_blocks) {
    existMeta[b.path.split("/")[1]] = { label: b.label, questions: b.questions };
  }

  // Assemble the full ordered block list from spec.order.
  blocks = spec.order.map((o) => {
    const meta = newMeta[o.page] ?? existMeta[o.page];
    if (!meta) throw new Error(`order references unknown page ${o.page}`);
    return {
      type: "h5p",
      path: `${slug}/${o.page}`,
      label: meta.label,
      questions: meta.questions,
      section: o.section,
    };
  });
} else {
  throw new Error(`unknown mode: ${spec.mode}`);
}

// Sanity: every referenced page exists on disk.
for (const b of blocks) {
  const dir = join(CONTENT, b.path);
  if (!existsSync(join(dir, "h5p.json"))) {
    throw new Error(`built page missing on disk: ${b.path}`);
  }
}

writeFileSync(
  join("scripts/blocks", `${slug}.json`),
  JSON.stringify({ slug, title: courseTitle, content_blocks: blocks }, null, 2) + "\n",
);

const sections = [...new Set(blocks.map((b) => b.section))];
console.log(
  `✓ ${slug} (${spec.mode}): ${blocks.length} pages, ${sections.length} sections -> scripts/blocks/${slug}.json`,
);
