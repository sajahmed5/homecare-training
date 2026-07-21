// Shuffle option order for mcq/multi questions in .add.json banks so the
// correct answer isn't always in the same position. Remaps answer_index /
// payload.correctIndices to follow the moved options. Leaves true_false
// (order is meaningful) and fill_blank untouched. Idempotent-ish; re-running
// just reshuffles. Run before appending.
//   node scripts/.shuffle-options.mjs <slug> [<slug> ...]
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const slugs = process.argv.slice(2);

// Deterministic PRNG (mulberry32) seeded per-slug so runs are reproducible.
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const seedFromSlug = (s) => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7);

for (const slug of slugs) {
  const p = join("scripts/quiz-banks", `${slug}.add.json`);
  if (!existsSync(p)) { console.log(`skip ${slug}: no file`); continue; }
  const spec = JSON.parse(readFileSync(p, "utf8"));
  const rand = rng(seedFromSlug(slug));
  let touched = 0;

  for (const q of spec.questions) {
    if (q.type !== "mcq" && q.type !== "multi") continue;
    const opts = q.options ?? [];
    const n = opts.length;
    if (n < 2) continue;
    // Fisher-Yates producing a permutation array `perm` where perm[newPos]=oldIdx.
    const perm = [...Array(n).keys()];
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [perm[i], perm[j]] = [perm[j], perm[i]];
    }
    const oldToNew = new Array(n);
    perm.forEach((oldIdx, newPos) => (oldToNew[oldIdx] = newPos));
    q.options = perm.map((oldIdx) => opts[oldIdx]);
    if (q.type === "mcq") {
      q.answer_index = oldToNew[q.answer_index];
    } else {
      q.payload = { ...q.payload, correctIndices: (q.payload?.correctIndices ?? []).map((i) => oldToNew[i]).sort((a, b) => a - b) };
    }
    touched++;
  }
  writeFileSync(p, JSON.stringify(spec, null, 2) + "\n");

  // Report the resulting mcq answer_index spread.
  const hist = [0, 0, 0, 0, 0];
  for (const q of spec.questions) if (q.type === "mcq") hist[q.answer_index]++;
  console.log(`✓ ${slug}: shuffled ${touched} mcq/multi — mcq index spread ${JSON.stringify(hist.slice(0, 4))}`);
}
