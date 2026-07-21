// Pre-flight check for authored .add.json banks before appending to the DB.
//   node scripts/.validate-add.mjs <slug> [<slug> ...]
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const slugs = process.argv.slice(2);
const norm = (s) => String(s ?? "").trim().toLowerCase().replace(/\s+/g, " ");
let problems = 0;

for (const slug of slugs) {
  const p = join("scripts/quiz-banks", `${slug}.add.json`);
  if (!existsSync(p)) { console.log(`✗ ${slug}: MISSING ${p}`); problems++; continue; }
  let spec;
  try { spec = JSON.parse(readFileSync(p, "utf8")); }
  catch (e) { console.log(`✗ ${slug}: INVALID JSON — ${e.message}`); problems++; continue; }

  const qs = spec.questions ?? [];
  const issues = [];
  if (spec.slug !== slug) issues.push(`slug field is "${spec.slug}"`);

  // Existing stems from the context pack, to catch near-duplicates.
  const ctxPath = join("scripts/quiz-banks/.context", `${slug}.md`);
  const existing = new Set();
  if (existsSync(ctxPath)) {
    const md = readFileSync(ctxPath, "utf8");
    const sect = md.split("## Course material")[0];
    for (const m of sect.matchAll(/^\d+\.\s+(.*)$/gm)) existing.add(norm(m[1]));
  }

  const localSeen = new Set();
  const byType = {};
  let idxHist = [0, 0, 0, 0, 0];
  qs.forEach((q, i) => {
    byType[q.type] = (byType[q.type] || 0) + 1;
    const tag = `Q${i + 1}(${q.type})`;
    if (!["mcq", "multi", "true_false", "fill_blank", "hotspot"].includes(q.type)) issues.push(`${tag}: bad type`);
    if (q.type === "mcq" || q.type === "true_false") {
      if (!Array.isArray(q.options) || typeof q.answer_index !== "number") issues.push(`${tag}: needs options + answer_index`);
      else {
        if (q.answer_index < 0 || q.answer_index >= q.options.length) issues.push(`${tag}: answer_index out of range`);
        if (new Set(q.options.map(norm)).size !== q.options.length) issues.push(`${tag}: duplicate options`);
        if (q.type === "mcq" && q.options.length !== 4) issues.push(`${tag}: expected 4 options, got ${q.options.length}`);
        if (q.type === "mcq") idxHist[q.answer_index]++;
      }
    }
    if (q.type === "multi") {
      const ci = q.payload?.correctIndices;
      if (!Array.isArray(ci) || ci.length < 1) issues.push(`${tag}: needs payload.correctIndices`);
      else if (ci.some((x) => x < 0 || x >= (q.options?.length ?? 0))) issues.push(`${tag}: correctIndices out of range`);
      if (Array.isArray(q.options) && new Set(q.options.map(norm)).size !== q.options.length) issues.push(`${tag}: duplicate options`);
    }
    if (q.type === "fill_blank") {
      const blanks = q.payload?.blanks?.length ?? 0;
      const markers = (q.question.match(/_{2,}/g) || []).length;
      if (!blanks || blanks !== markers) issues.push(`${tag}: blanks(${blanks}) != markers(${markers})`);
      if ((q.payload?.blanks ?? []).some((b) => !(b.answers?.length))) issues.push(`${tag}: a blank has no answers`);
    }
    const key = norm(q.question);
    if (localSeen.has(key)) issues.push(`${tag}: duplicate within file`);
    localSeen.add(key);
    if (existing.has(key)) issues.push(`${tag}: duplicates an EXISTING question`);
  });

  // Heuristic: mcq correct answers shouldn't cluster on one index.
  const mcqTotal = idxHist.reduce((a, b) => a + b, 0);
  if (mcqTotal >= 8 && Math.max(...idxHist) / mcqTotal > 0.6) issues.push(`mcq answers cluster on one index: ${JSON.stringify(idxHist)}`);

  if (issues.length) { problems += issues.length; console.log(`✗ ${slug} (${qs.length} Qs ${JSON.stringify(byType)}):`); issues.forEach((x) => console.log(`    - ${x}`)); }
  else console.log(`✓ ${slug}: ${qs.length} Qs ${JSON.stringify(byType)}`);
}
console.log(`\nproblems: ${problems}`);
process.exit(problems ? 1 : 0);
