// Dump a course's current pages (in reading order) as a readable JSON digest,
// so an editorial pass can review it for redundancy / right-sizing.
//
//   node scripts/extract-course-spec.mjs <slug> [> out.json]
//
// Reads the committed blocks snapshot (reading order) + each page's content.json
// and emits, per page: index, folder path, label, section, and its panels
// (AdvancedText text, Image file, or a question summary). Read-only.
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const slug = process.argv[2];
if (!slug) {
  console.error("usage: node scripts/extract-course-spec.mjs <slug>");
  process.exit(1);
}

const CONTENT = "public/h5p/content";
const snap = JSON.parse(readFileSync(`scripts/blocks/${slug}.json`, "utf8"));
const strip = (h) => String(h || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const words = (h) => strip(h).split(/\s+/).filter(Boolean).length;

const pages = (snap.content_blocks ?? [])
  .filter((b) => b?.type === "h5p" && b.path)
  .map((b, index) => {
    const file = join(CONTENT, b.path, "content", "content.json");
    const panels = [];
    if (existsSync(file)) {
      const doc = JSON.parse(readFileSync(file, "utf8"));
      for (const p of doc.content ?? []) {
        const lib = p?.content?.library ?? "";
        const prm = p?.content?.params ?? {};
        if (lib.startsWith("H5P.AdvancedText")) {
          panels.push({ kind: "text", words: words(prm.text), html: prm.text });
        } else if (lib.startsWith("H5P.Image")) {
          panels.push({ kind: "image", file: prm?.file?.path, alt: prm?.alt });
        } else {
          panels.push({
            kind: "question",
            lib: lib.split(" ")[0],
            prompt: strip(prm.question || prm.taskDescription || prm.text).slice(0, 160),
          });
        }
      }
    }
    return {
      index,
      path: b.path,
      label: b.label,
      section: b.section ?? null,
      questions: b.questions ?? 0,
      totalWords: panels.filter((p) => p.kind === "text").reduce((n, p) => n + p.words, 0),
      panels,
    };
  });

console.log(
  JSON.stringify(
    { slug, title: snap.title, pageCount: pages.length, pages },
    null,
    2,
  ),
);
