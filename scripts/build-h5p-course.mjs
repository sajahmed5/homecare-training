// Reusable H5P course builder.
//
//   node scripts/build-h5p-course.mjs <spec.json> [--assets <dir>] [--set-db]
//
// Reads a course spec (see schema below) and writes one extracted-.h5p folder
// per page under public/h5p/content/<slug>/pN (each an H5P.Column). Libraries
// are shared from public/h5p/libraries. With --set-db it also points the course
// (matched by spec.courseTitle) at the generated pages.
//
// Spec schema:
// {
//   "slug": "fire-safety",
//   "courseTitle": "Fire Safety",
//   "pages": [
//     { "label": "Introduction", "items": [ <item>, ... ] }, ...
//   ]
// }
// Item types:
//   { "type":"text", "html":"<h2>..</h2><p>..</p>" }
//   { "type":"image", "file":"hero.svg", "alt":"..", "width":600, "height":320 }
//   { "type":"dialogcards", "title":"..", "description":"..",
//     "cards":[ { "front":"..", "back":"..", "image":"icon.svg" }, ... ] }
//   { "type":"dragtext", "taskDescription":"..", "textField":"..* answer *.." }
//   { "type":"multichoice", "question":"..", "singleAnswer":true,
//     "answers":[ { "text":"..", "correct":true, "feedback":".." }, ... ] }
//   { "type":"truefalse", "question":"..", "correct":true|false,
//     "correctMsg":"..", "wrongMsg":".." }
import { randomUUID } from "node:crypto";
import { readFileSync, readdirSync, mkdirSync, writeFileSync, rmSync, cpSync, existsSync } from "node:fs";
import { join, dirname, basename } from "node:path";

const args = process.argv.slice(2);
const specPath = args.find((a) => !a.startsWith("--"));
const assetsDir = args.includes("--assets") ? args[args.indexOf("--assets") + 1] : dirname(specPath || ".");
const setDb = args.includes("--set-db");
if (!specPath) {
  console.error("Usage: node scripts/build-h5p-course.mjs <spec.json> [--assets <dir>] [--set-db]");
  process.exit(1);
}

const PROJECT = process.cwd();
const LIBS = join(PROJECT, "public/h5p/libraries");
const spec = JSON.parse(readFileSync(specPath, "utf8"));
const BASE = join(PROJECT, "public/h5p/content", spec.slug);

// resolve versions + dependency graph from vendored libraries
const byMachine = {};
for (const f of readdirSync(LIBS)) {
  const lib = JSON.parse(readFileSync(join(LIBS, f, "library.json"), "utf8"));
  byMachine[lib.machineName] = { major: lib.majorVersion, minor: lib.minorVersion, lib };
}
const ver = (m) => {
  if (!byMachine[m]) throw new Error(`Missing library ${m} in public/h5p/libraries`);
  return `${m} ${byMachine[m].major}.${byMachine[m].minor}`;
};

let panelWrap = (library, params, title) => ({
  content: { params, library: ver(library), subContentId: randomUUID(), metadata: { contentType: library, license: "U", title } },
  useSeparator: "auto",
});

const imgRef = (file, w, h) => ({ path: `images/${file}`, mime: "image/svg+xml", width: w || 360, height: h || 200, copyright: { license: "U" } });

// --- item -> {panel, library, assets[]} --------------------------------------
function buildItem(it) {
  switch (it.type) {
    case "text":
      return { panel: panelWrap("H5P.AdvancedText", { text: it.html }, "Text"), libs: ["H5P.AdvancedText"], assets: [] };
    case "image":
      return {
        panel: panelWrap("H5P.Image", { contentName: "Image", alt: it.alt || "", decorative: false, file: imgRef(it.file, it.width, it.height) }, "Image"),
        libs: ["H5P.Image"], assets: [it.file],
      };
    case "dialogcards": {
      const assets = [];
      const dialogs = it.cards.map((c) => {
        const d = { text: `<p>${c.front}</p>`, answer: `<p>${c.back}</p>`, tips: {} };
        if (c.image) { d.image = imgRef(c.image, 360, 150); d.imageAltText = c.imageAlt || ""; assets.push(c.image); }
        return d;
      });
      return {
        panel: panelWrap("H5P.Dialogcards", {
          title: `<p>${it.title || "Tap a card to flip it"}</p>`, mode: "normal",
          description: `<p>${it.description || ""}</p>`, dialogs,
          behaviour: { enableRetry: true, disableBackwardsNavigation: false, scaleTextNotCard: false, randomCards: false },
          answer: "Turn", next: "Next", prev: "Previous", retry: "Retry", progressText: "Card @card of @total",
        }, "Flip cards"),
        libs: ["H5P.Dialogcards"], assets,
      };
    }
    case "dragtext":
      return {
        panel: panelWrap("H5P.DragText", {
          taskDescription: `<p>${it.taskDescription}</p>`, textField: it.textField,
          behaviour: { enableRetry: true, enableSolutionsButton: true, enableCheckButton: true, instantFeedback: false },
          overallFeedback: [{ from: 0, to: 100, feedback: "You placed @score of @total correctly." }],
          checkAnswer: "Check", tryAgain: "Retry", showSolution: "Show solution", correctText: "Correct!", incorrectText: "Incorrect!",
        }, "Fill in the blanks"),
        libs: ["H5P.DragText"], assets: [],
      };
    case "multichoice":
      return {
        panel: panelWrap("H5P.MultiChoice", {
          question: `<p>${it.question}</p>`,
          answers: it.answers.map((a) => ({ correct: !!a.correct, text: `<div>${a.text}</div>`, tipsAndFeedback: { tip: "", chosenFeedback: a.feedback || "", notChosenFeedback: "" } })),
          behaviour: { enableRetry: true, enableSolutionsButton: true, singlePoint: it.singleAnswer !== false, randomAnswers: true, type: "auto" },
          UI: { checkAnswerButton: "Check", showSolutionButton: "Show solution", tryAgainButton: "Retry" },
        }, "Knowledge check"),
        libs: ["H5P.MultiChoice"], assets: [],
      };
    case "truefalse":
      return {
        panel: panelWrap("H5P.TrueFalse", {
          question: `<p>${it.question}</p>`, correct: it.correct ? "true" : "false",
          l10n: { trueText: "True", falseText: "False", checkAnswer: "Check", showSolutionButton: "Show solution", tryAgain: "Retry", wrongAnswerMessage: it.wrongMsg || "Not quite.", correctAnswerMessage: it.correctMsg || "Correct." },
          behaviour: { enableRetry: true, enableSolutionsButton: true },
        }, "True or false"),
        libs: ["H5P.TrueFalse"], assets: [],
      };
    default:
      throw new Error(`Unknown item type: ${it.type}`);
  }
}

// --- write pages -------------------------------------------------------------
rmSync(BASE, { recursive: true, force: true });

function closure(topLibs) {
  const seen = new Set();
  const walk = (m) => { if (seen.has(m) || !byMachine[m]) return; seen.add(m); for (const d of byMachine[m].lib.preloadedDependencies ?? []) walk(d.machineName); };
  for (const m of topLibs) walk(m);
  return [...seen];
}

const blocks = [];
spec.pages.forEach((page, i) => {
  const dir = join(BASE, `p${i + 1}`);
  mkdirSync(join(dir, "content"), { recursive: true });

  const built = page.items.map(buildItem);
  const files = built.flatMap((b) => b.assets);
  if (files.length) {
    mkdirSync(join(dir, "content", "images"), { recursive: true });
    for (const f of files) {
      const src = join(assetsDir, f);
      if (!existsSync(src)) throw new Error(`Missing asset: ${src}`);
      cpSync(src, join(dir, "content", "images", basename(f)));
    }
  }

  writeFileSync(join(dir, "content", "content.json"), JSON.stringify({ content: built.map((b) => b.panel) }));

  const used = new Set(["H5P.Column", ...built.flatMap((b) => b.libs)]);
  const h5p = {
    title: `${spec.courseTitle} — ${page.label}`, language: "en", mainLibrary: "H5P.Column",
    embedTypes: ["div"], license: "U", defaultLanguage: "en",
    preloadedDependencies: closure(used).map((m) => ({ machineName: m, majorVersion: byMachine[m].major, minorVersion: byMachine[m].minor })),
  };
  writeFileSync(join(dir, "h5p.json"), JSON.stringify(h5p, null, 1));
  blocks.push({ type: "h5p", path: `${spec.slug}/p${i + 1}`, label: page.label });
  console.log(`  p${i + 1} "${page.label}" — ${built.length} panel(s)`);
});

console.log(`Built ${spec.pages.length} pages for "${spec.courseTitle}" -> ${BASE}`);

if (setDb) {
  const { config } = await import("dotenv");
  config({ path: ".env.local" });
  const { createClient } = await import("@supabase/supabase-js");
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const { data, error } = await admin.from("courses").update({ content_blocks: blocks }).eq("title", spec.courseTitle).select("id");
  if (error) { console.error("DB update failed:", error.message); process.exit(1); }
  if (!data?.length) { console.error(`No course titled "${spec.courseTitle}"`); process.exit(1); }
  console.log(`DB: pointed "${spec.courseTitle}" at ${blocks.length} H5P pages.`);
} else {
  console.log("BLOCKS_JSON=" + JSON.stringify(blocks));
}
