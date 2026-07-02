// Fetch royalty-free photos from Unsplash for training modules.
//
//   node scripts/fetch-images.mjs <manifest.json>
//
// Manifest:
// {
//   "outDir": "/tmp/h5pwork/photos",
//   "creditsFile": "public/h5p/IMAGE-CREDITS.json",
//   "images": [ { "query": "care worker washing hands", "file": "handwashing.jpg" }, ... ]
// }
//
// Complies with the Unsplash API guidelines: uses the API (not hotlinking),
// triggers the download endpoint per used photo, and records attribution
// (photographer name + profile + photo link) to the credits file.
import { config } from "dotenv";
config({ path: ".env.local" });
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const KEY = process.env.UNSPLASH_ACCESS_KEY;
if (!KEY) { console.error("Missing UNSPLASH_ACCESS_KEY in .env.local"); process.exit(1); }

const manifestPath = process.argv[2];
if (!manifestPath) { console.error("Usage: node scripts/fetch-images.mjs <manifest.json>"); process.exit(1); }
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
mkdirSync(manifest.outDir, { recursive: true });

const auth = { headers: { Authorization: `Client-ID ${KEY}`, "Accept-Version": "v1" } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// existing credits (append)
const creditsPath = manifest.creditsFile;
let credits = existsSync(creditsPath) ? JSON.parse(readFileSync(creditsPath, "utf8")) : {};

let ok = 0, fail = 0;
for (const img of manifest.images) {
  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(img.query)}&per_page=5&orientation=${img.orientation || "landscape"}&content_filter=high`;
    const res = await fetch(url, auth);
    if (!res.ok) throw new Error(`search HTTP ${res.status}`);
    const data = await res.json();
    const photo = (data.results || [])[img.pick || 0];
    if (!photo) throw new Error("no results");

    // per Unsplash guidelines: trigger the download endpoint
    if (photo.links?.download_location) {
      await fetch(photo.links.download_location, auth).catch(() => {});
    }

    // download the image bytes (regular ~1080px is plenty)
    const bin = await fetch(photo.urls.regular);
    if (!bin.ok) throw new Error(`download HTTP ${bin.status}`);
    const buf = Buffer.from(await bin.arrayBuffer());
    writeFileSync(join(manifest.outDir, img.file), buf);

    const w = 1080;
    const h = photo.width && photo.height ? Math.round((1080 * photo.height) / photo.width) : 720;
    credits[img.file] = {
      query: img.query,
      id: photo.id,
      photographer: photo.user?.name,
      photographerUrl: photo.user?.links?.html,
      photoUrl: photo.links?.html,
      alt: photo.alt_description || "",
      width: w,
      height: h,
    };
    console.log(`✓ ${img.file}  (${Math.round(buf.length / 1024)}KB) — ${photo.user?.name}`);
    ok++;
    await sleep(400); // be gentle on the rate limit
  } catch (e) {
    console.log(`✗ ${img.file} — ${e.message}`);
    fail++;
  }
}

if (creditsPath) {
  mkdirSync(dirname(creditsPath), { recursive: true });
  writeFileSync(creditsPath, JSON.stringify(credits, null, 2));
}
console.log(`\nFetched ${ok} image(s), ${fail} failed. Credits -> ${creditsPath}`);
