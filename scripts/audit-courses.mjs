// Integrity audit for every course in the catalogue.
//
//   node scripts/audit-courses.mjs [--prod] [--base https://...]
//
// A learner should never hit a broken page halfway through a course. The
// content lives in three places that can drift apart:
//
//   1. the database  (courses.content_blocks -> page paths)
//   2. the repo      (public/h5p/content/<slug>/pN — must be COMMITTED)
//   3. production    (deployed static files)
//
// Because the database is shared with production, a content_blocks change
// goes live instantly while its files wait for a deploy. That gap is exactly
// how a course breaks. This script checks all three agree.
//
// Exit code 1 if any ERROR-level problem is found, so it can gate a deploy.
import { config } from "dotenv";
config({ path: ".env.local" });
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

const args = process.argv.slice(2);
const CHECK_PROD = args.includes("--prod");
const BASE = args.includes("--base")
  ? args[args.indexOf("--base") + 1]
  : "https://homecare-training.vercel.app";

const CONTENT_ROOT = "public/h5p/content";
const errors = [];
const warnings = [];
const err = (course, msg) => errors.push(`${course}: ${msg}`);
const warn = (course, msg) => warnings.push(`${course}: ${msg}`);

// Files git actually knows about. Anything referenced but untracked exists
// only on this machine and will 404 for everyone else.
const tracked = new Set(
  execSync("git ls-files public/h5p/content", { encoding: "utf8" })
    .split("\n")
    .filter(Boolean),
);

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const { data: courses, error } = await sb
  .from("courses")
  .select("id, title, slug, content_blocks")
  .order("sort_order");
if (error) {
  console.error("Could not read courses:", error.message);
  process.exit(1);
}

const referencedDirs = new Set();
const prodChecks = [];
let pageCount = 0;

for (const course of courses) {
  const name = course.title;
  const blocks = Array.isArray(course.content_blocks) ? course.content_blocks : [];

  if (!blocks.length) {
    err(name, "has no content_blocks — course would open empty");
    continue;
  }

  const seenPaths = new Set();

  for (const [i, block] of blocks.entries()) {
    const label = `block ${i + 1} (${block.label ?? "unlabelled"})`;
    if (block.type !== "h5p") continue;
    if (!block.path) {
      err(name, `${label} has no path`);
      continue;
    }
    if (seenPaths.has(block.path)) {
      warn(name, `${label} repeats path ${block.path}`);
    }
    seenPaths.add(block.path);

    const dir = join(CONTENT_ROOT, block.path);
    referencedDirs.add(block.path);
    pageCount++;

    const manifest = join(dir, "h5p.json");
    const contentFile = join(dir, "content", "content.json");

    if (!existsSync(manifest) || !existsSync(contentFile)) {
      err(name, `${label} -> ${block.path} MISSING on disk`);
      continue;
    }

    // Committed? An untracked page is local-only and breaks for everyone else.
    for (const f of [manifest, contentFile]) {
      if (!tracked.has(f)) err(name, `${label} -> ${f} NOT COMMITTED to git`);
    }

    let manifestJson, contentJson;
    try {
      manifestJson = JSON.parse(readFileSync(manifest, "utf8"));
      contentJson = JSON.parse(readFileSync(contentFile, "utf8"));
    } catch (e) {
      err(name, `${label} -> ${block.path} INVALID JSON (${e.message})`);
      continue;
    }

    // Every library used must be declared, or H5P renders the page blank with
    // "Unable to find constructor for: <library>".
    const declared = new Set(
      (manifestJson.preloadedDependencies ?? []).map((d) => d.machineName),
    );
    const used = new Set(
      [...JSON.stringify(contentJson).matchAll(/"library"\s*:\s*"(H5P\.[A-Za-z]+)/g)].map(
        (m) => m[1],
      ),
    );
    for (const lib of used) {
      if (!declared.has(lib)) {
        err(name, `${label} -> ${block.path} uses ${lib} but does not declare it (page renders blank)`);
      }
    }

    // Referenced media must exist and be committed.
    const items = Array.isArray(contentJson.content) ? contentJson.content : [];
    for (const it of items) {
      const file = it?.content?.params?.file?.path;
      if (!file) continue;
      const asset = join(dir, "content", file);
      if (!existsSync(asset)) err(name, `${label} -> missing image ${file}`);
      else if (!tracked.has(asset)) err(name, `${label} -> image ${file} NOT COMMITTED`);
    }

    // The gating count must match reality, or Next locks forever / never locks.
    const QUESTION_LIBS = /H5P\.(MultiChoice|TrueFalse|DragText|Blanks|MarkTheWords)/;
    const actualQuestions = items.filter((it) =>
      QUESTION_LIBS.test(it?.content?.library ?? ""),
    ).length;
    const declaredQuestions = block.questions ?? 0;
    if (actualQuestions !== declaredQuestions) {
      err(
        name,
        `${label} -> declares questions:${declaredQuestions} but page has ${actualQuestions} (gating will misbehave)`,
      );
    }

    if (CHECK_PROD) prodChecks.push({ name, label, path: block.path });
  }
}

// Directories on disk that no course points at — dead weight in the bundle.
if (existsSync(CONTENT_ROOT)) {
  for (const slug of readdirSync(CONTENT_ROOT)) {
    const slugDir = join(CONTENT_ROOT, slug);
    let pages;
    try {
      pages = readdirSync(slugDir).filter((p) => /^p\d+$/.test(p));
    } catch {
      continue;
    }
    for (const p of pages) {
      if (!referencedDirs.has(`${slug}/${p}`)) {
        warn("orphan", `${slug}/${p} exists on disk but no course references it`);
      }
    }
  }
}

// Assessment banks — the pool must be big enough to actually mean something.
const { data: allQ } = await sb.from("quiz_questions").select("course_id");
const bank = {};
for (const q of allQ ?? []) bank[q.course_id] = (bank[q.course_id] ?? 0) + 1;
const QUIZ_TARGET = 20;
for (const c of courses) {
  const n = bank[c.id] ?? 0;
  if (n === 0) err(c.title, "has NO assessment questions");
  else if (n < QUIZ_TARGET) err(c.title, `bank has only ${n} questions, assessment needs ${QUIZ_TARGET}`);
  else if (n === QUIZ_TARGET) warn(c.title, `bank is exactly ${QUIZ_TARGET} — every learner sees every question, no randomisation`);
}

// Production reachability, in parallel batches.
if (CHECK_PROD) {
  process.stdout.write(`Checking ${prodChecks.length} pages on ${BASE} `);
  const BATCH = 12;
  for (let i = 0; i < prodChecks.length; i += BATCH) {
    const slice = prodChecks.slice(i, i + BATCH);
    await Promise.all(
      slice.map(async ({ name, label, path }) => {
        const url = `${BASE}/h5p/content/${path}/h5p.json`;
        try {
          const res = await fetch(url, { method: "HEAD" });
          if (!res.ok) err(name, `${label} -> ${path} returns HTTP ${res.status} on production`);
        } catch (e) {
          err(name, `${label} -> ${path} unreachable on production (${e.message})`);
        }
      }),
    );
    process.stdout.write(".");
  }
  process.stdout.write("\n");
}

console.log(`\nAudited ${courses.length} courses / ${pageCount} pages.`);
if (warnings.length) {
  console.log(`\n⚠️  ${warnings.length} warning(s):`);
  warnings.forEach((w) => console.log("   " + w));
}
if (errors.length) {
  console.log(`\n❌ ${errors.length} error(s):`);
  errors.forEach((e) => console.log("   " + e));
  process.exit(1);
}
console.log("\n✅ No errors. Database, repo and" + (CHECK_PROD ? " production" : " git") + " agree.");
