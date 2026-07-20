// Inject a photo into an existing H5P.Column course page.
//
//   node scripts/inject-course-photo.mjs <plan.json>
//
// Plan:
// {
//   "srcDir": "/tmp/photos",
//   "creditsFile": "public/h5p/IMAGE-CREDITS.json",
//   "insertions": [
//     { "course": "privacy-and-dignity", "page": 4, "file": "privacy-personal-care.jpg",
//       "alt": "A care worker supporting people with everyday activities", "at": 1 }
//   ]
// }
//
// Copies the image into <course>/p<page>/content/images/ and splices an
// H5P.Image item into the Column's content array at index `at` (default 1,
// i.e. just after the opening text block — matching the existing courses).
// Idempotent: re-running replaces a previously injected image of the same file.
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

const planPath = process.argv[2];
if (!planPath) {
  console.error("Usage: node scripts/inject-course-photo.mjs <plan.json>");
  process.exit(1);
}
const plan = JSON.parse(readFileSync(planPath, "utf8"));
const credits = existsSync(plan.creditsFile)
  ? JSON.parse(readFileSync(plan.creditsFile, "utf8"))
  : {};

// Read intrinsic size straight from the JPEG SOF marker so the H5P metadata
// matches the actual file rather than an assumed aspect ratio.
function jpegSize(buf) {
  let i = 2;
  while (i < buf.length) {
    if (buf[i] !== 0xff) { i++; continue; }
    const marker = buf[i + 1];
    const len = buf.readUInt16BE(i + 2);
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
    }
    i += 2 + len;
  }
  return null;
}

let done = 0;
for (const ins of plan.insertions) {
  const pageDir = join("public/h5p/content", ins.course, `p${ins.page}`);
  const contentPath = join(pageDir, "content", "content.json");
  if (!existsSync(contentPath)) {
    console.error(`✗ ${ins.course} p${ins.page}: no content.json`);
    continue;
  }

  const src = join(plan.srcDir, ins.file);
  if (!existsSync(src)) {
    console.error(`✗ ${ins.course} p${ins.page}: missing source ${ins.file}`);
    continue;
  }

  const imagesDir = join(pageDir, "content", "images");
  mkdirSync(imagesDir, { recursive: true });
  copyFileSync(src, join(imagesDir, ins.file));

  const buf = readFileSync(src);
  const size = jpegSize(buf) ?? { width: 1080, height: 720 };

  const doc = JSON.parse(readFileSync(contentPath, "utf8"));
  const items = doc.content;
  const relPath = `images/${ins.file}`;

  // Drop any previous injection of this same file so re-runs stay clean.
  const before = items.length;
  doc.content = items.filter(
    (it) => it?.content?.params?.file?.path !== relPath,
  );
  const replaced = before !== doc.content.length;

  const item = {
    content: {
      params: {
        contentName: "Image",
        alt: ins.alt,
        decorative: false,
        file: {
          path: relPath,
          mime: ins.file.endsWith(".png") ? "image/png" : "image/jpeg",
          width: size.width,
          height: size.height,
          copyright: { license: "U" },
        },
      },
      library: "H5P.Image 1.1",
      subContentId: randomUUID(),
      metadata: { contentType: "H5P.Image", license: "U", title: "Image" },
    },
    useSeparator: "auto",
  };

  const at = Math.min(ins.at ?? 1, doc.content.length);
  doc.content.splice(at, 0, item);
  writeFileSync(contentPath, JSON.stringify(doc, null, 2));

  // H5P resolves sub-content constructors from the page manifest's
  // preloadedDependencies — without this entry the Column renders empty and
  // the console logs "Unable to find constructor for: H5P.Image 1.1".
  const manifestPath = join(pageDir, "h5p.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  manifest.preloadedDependencies ??= [];
  const hasImage = manifest.preloadedDependencies.some(
    (d) => d.machineName === "H5P.Image",
  );
  if (!hasImage) {
    // Keep it next to the other content types, before the shared UI libs.
    const idx = manifest.preloadedDependencies.findIndex(
      (d) => d.machineName === "FontAwesome",
    );
    const dep = { machineName: "H5P.Image", majorVersion: 1, minorVersion: 1 };
    if (idx === -1) manifest.preloadedDependencies.push(dep);
    else manifest.preloadedDependencies.splice(idx, 0, dep);
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  }

  const credit = credits[ins.file];
  const by = credit ? ` — ${credit.photographer ?? credit.name ?? "Unsplash"}` : "";
  console.log(
    `${replaced ? "↻" : "✓"} ${ins.course} p${ins.page} @${at}  ${ins.file} (${size.width}x${size.height})${by}`,
  );
  done++;
}
console.log(`\nInjected ${done}/${plan.insertions.length} image(s).`);
