// Generate original, lightly animated character illustrations for course pages.
//
//   node scripts/make-illustration.mjs <scenes.json>
//
// Everything is drawn from primitives here — nothing is traced or copied from
// stock art, so the output is ours to license with the courses.
//
// Animation is declared in a <style> block INSIDE each SVG. That matters:
// H5P renders images with <img src>, and an external stylesheet would not
// apply, but styles and @keyframes inside the file still run. Motion is kept
// gentle and is disabled under prefers-reduced-motion.
//
// Scene spec:
// {
//   "outDir": "public/h5p/content/lone-working/p10/content/images",
//   "scenes": [{
//     "file": "travel-safety.svg",
//     "title": "Plan the journey, not just the visit",
//     "accent": "#d97706",
//     "alt": "A care worker planning a route before setting off",
//     "cast": [{ "skin": 2, "hair": "bun", "tunic": "#0d9488", "prop": "phone" }],
//     "points": ["Check the route before you go", "Park where you can drive out", "Keep a charged phone"]
//   }]
// }
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const specPath = process.argv[2];
if (!specPath) {
  console.error("Usage: node scripts/make-illustration.mjs <scenes.json>");
  process.exit(1);
}
const spec = JSON.parse(readFileSync(specPath, "utf8"));

// A deliberately broad range so the cast across a course looks like a real team.
const SKINS = ["#8d5524", "#c68642", "#e0ac69", "#f1c27d", "#5c3317", "#ffdbac"];
const HAIRS = ["#2b2118", "#4a3728", "#6b4423", "#8d6748", "#c19a6b", "#3b3b3b"];

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Mix a hex colour towards white — used for tinted backgrounds and fills. */
function tint(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const m = (c) => Math.round(c + (255 - c) * amount);
  return `#${((m(r) << 16) | (m(g) << 8) | m(b)).toString(16).padStart(6, "0")}`;
}

/** Props a care worker actually carries, drawn simply and read at small size. */
function prop(kind, accent) {
  switch (kind) {
    case "phone":
      return `<g transform="translate(34 -14)"><rect width="22" height="38" rx="5" fill="#1f2937"/><rect x="3" y="4" width="16" height="26" rx="2" fill="${tint(accent, 0.55)}"/><circle cx="11" cy="33" r="2" fill="${tint(accent, 0.55)}"/></g>`;
    case "clipboard":
      return `<g transform="translate(32 -10)"><rect width="30" height="40" rx="4" fill="#fff" stroke="#cbd5e1" stroke-width="2"/><rect x="9" y="-4" width="12" height="8" rx="2" fill="${accent}"/><rect x="6" y="12" width="18" height="3" rx="1.5" fill="#cbd5e1"/><rect x="6" y="20" width="14" height="3" rx="1.5" fill="#cbd5e1"/><rect x="6" y="28" width="16" height="3" rx="1.5" fill="#cbd5e1"/></g>`;
    case "pills":
      return `<g transform="translate(34 -6)"><rect width="26" height="34" rx="5" fill="#fff" stroke="${accent}" stroke-width="2"/><rect x="5" y="7" width="16" height="4" rx="2" fill="${accent}"/><circle cx="9" cy="20" r="3.5" fill="${accent}" opacity=".65"/><circle cx="18" cy="20" r="3.5" fill="${accent}" opacity=".4"/><circle cx="13" cy="27" r="3.5" fill="${accent}" opacity=".55"/></g>`;
    case "heart":
      return `<g transform="translate(36 -12)"><g class="pulse"><path d="M14 30 L3 19 a7 7 0 0 1 11-9 a7 7 0 0 1 11 9 z" fill="${accent}" opacity=".85"/></g></g>`;
    case "alert":
      return `<g transform="translate(34 -10)"><g class="pulse"><path d="M15 0 L30 28 H0 Z" fill="${accent}" opacity=".9"/><rect x="13" y="10" width="4" height="10" rx="2" fill="#fff"/><circle cx="15" cy="24" r="2.2" fill="#fff"/></g></g>`;
    default:
      return "";
  }
}

/** Hair sits over the head circle; kept as simple silhouettes. */
function hair(style, colour) {
  switch (style) {
    case "bun":
      return `<circle cx="0" cy="-38" r="7" fill="${colour}"/><path d="M-18 -30 a18 18 0 0 1 36 0 a18 12 0 0 0 -36 0z" fill="${colour}"/>`;
    case "curly":
      return `<g fill="${colour}"><circle cx="-13" cy="-32" r="9"/><circle cx="0" cy="-38" r="10"/><circle cx="13" cy="-32" r="9"/></g>`;
    case "headscarf":
      return `<path d="M-20 -26 a20 22 0 0 1 40 0 q0 14 -8 18 h-24 q-8 -4 -8 -18z" fill="${colour}"/>`;
    case "short":
      return `<path d="M-18 -28 a18 18 0 0 1 36 0 q-6 -8 -18 -8 t-18 8z" fill="${colour}"/>`;
    case "bald":
      return "";
    default:
      return `<path d="M-18 -28 a18 18 0 0 1 36 0 q-6 -8 -18 -8 t-18 8z" fill="${colour}"/>`;
  }
}

/** One character: head, face, tunic, optional prop. Blinks and bobs gently. */
function character(person, accent, i) {
  const skin = SKINS[(person.skin ?? i) % SKINS.length];
  const hairCol = HAIRS[(person.hairColour ?? i + 1) % HAIRS.length];
  const tunic = person.tunic ?? accent;
  return `
  <g class="bob" style="animation-delay:${(i * 0.7).toFixed(1)}s">
    <path d="M-30 46 a30 34 0 0 1 60 0 z" fill="${tunic}"/>
    <path d="M-9 14 h18 v14 h-18 z" fill="${skin}"/>
    <circle cx="0" cy="-8" r="20" fill="${skin}"/>
    ${hair(person.hair, hairCol)}
    <g class="blink">
      <circle cx="-7" cy="-10" r="2.2" fill="#1f2937"/>
      <circle cx="7" cy="-10" r="2.2" fill="#1f2937"/>
    </g>
    <path d="M-7 0 q7 6 14 0" stroke="#1f2937" stroke-width="2" fill="none" stroke-linecap="round"/>
    <circle cx="-11" cy="-2" r="3.5" fill="#f87171" opacity=".28"/>
    <circle cx="11" cy="-2" r="3.5" fill="#f87171" opacity=".28"/>
    ${prop(person.prop, accent)}
  </g>`;
}

function scene(s) {
  const accent = s.accent ?? "#0d9488";
  const cast = s.cast ?? [{}];
  const points = (s.points ?? []).slice(0, 3);
  const W = 640;
  const H = 60 + Math.max(150, points.length * 44 + 40);

  const figures = cast
    .map((p, i) => `<g transform="translate(${96 + i * 92} ${H - 78})">${character(p, accent, i)}</g>`)
    .join("");

  // The animated class goes on an INNER group. A CSS transform overrides the
  // transform attribute rather than composing with it, so animating the same
  // element that carries translate() throws the positioning away.
  const rows = points
    .map(
      (t, i) => `
    <g transform="translate(250 ${76 + i * 44})">
      <g class="rise" style="animation-delay:${(0.15 + i * 0.12).toFixed(2)}s">
        <rect width="330" height="34" rx="17" fill="#ffffff" stroke="${tint(accent, 0.55)}" stroke-width="2"/>
        <circle cx="22" cy="17" r="7" fill="${accent}"/>
        <path d="M18.5 17 l2.5 2.5 l4.5 -5" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <text x="42" y="22" font-family="Inter, Arial, sans-serif" font-size="12.5" font-weight="600" fill="#334155">${esc(t)}</text>
      </g>
    </g>`,
    )
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(s.alt ?? s.title)}">
  <style>
    .bob { animation: bob 4.5s ease-in-out infinite; transform-box: fill-box; transform-origin: 50% 100%; }
    .blink { animation: blink 6s step-end infinite; transform-box: fill-box; transform-origin: 50% 50%; }
    .pulse { animation: pulse 2.4s ease-in-out infinite; transform-box: fill-box; transform-origin: 50% 50%; }
    .rise { animation: rise .5s ease-out both; }
    @keyframes bob { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-4px) } }
    @keyframes blink { 0%,92%,100% { transform: scaleY(1) } 95% { transform: scaleY(.1) } }
    @keyframes pulse { 0%,100% { transform: scale(1); opacity:.9 } 50% { transform: scale(1.09); opacity:1 } }
    @keyframes rise { from { opacity:0; transform: translateY(6px) } to { opacity:1; transform: translateY(0) } }
    @media (prefers-reduced-motion: reduce) {
      .bob, .blink, .pulse, .rise { animation: none }
    }
  </style>
  <rect width="${W}" height="${H}" rx="18" fill="${tint(accent, 0.93)}"/>
  <text x="32" y="42" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="700" fill="${accent}">${esc(s.title)}</text>
  ${figures}
  ${rows}
</svg>
`;
}

mkdirSync(spec.outDir ?? ".", { recursive: true });
let n = 0;
for (const s of spec.scenes) {
  const dir = s.outDir ?? spec.outDir;
  mkdirSync(dir, { recursive: true });
  const svg = scene(s);
  writeFileSync(join(dir, s.file), svg);
  console.log(`✓ ${join(dir, s.file)}  (${(svg.length / 1024).toFixed(1)} KB)`);
  n++;
}
console.log(`\nGenerated ${n} illustration(s).`);
