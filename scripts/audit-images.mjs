// Read-only inventory of course pages that have no image.
//
//   node scripts/audit-images.mjs [--json]
//
// Every image-less page is a candidate for a generated illustration. This lists
// them per course (with the page label and section) so the illustration rollout
// has an exact worklist and a progress metric. Emits JSON with --json.
import { config } from "dotenv";
config({ path: ".env.local" });
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const asJson = process.argv.includes("--json");

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const { data: courses, error } = await sb
  .from("courses")
  .select("slug, title, content_blocks")
  .order("sort_order");
if (error) {
  console.error(error.message);
  process.exit(1);
}

const result = [];
let totalPages = 0;
let imagelessPages = 0;

for (const course of courses) {
  const blocks = Array.isArray(course.content_blocks) ? course.content_blocks : [];
  const missing = [];
  for (const b of blocks) {
    if (b.type !== "h5p" || !b.path) continue;
    totalPages++;
    const contentPath = join("public/h5p/content", b.path, "content", "content.json");
    if (!existsSync(contentPath)) continue;
    const doc = JSON.parse(readFileSync(contentPath, "utf8"));
    const items = Array.isArray(doc.content) ? doc.content : [];
    const hasImage = items.some((it) =>
      (it?.content?.library ?? "").startsWith("H5P.Image"),
    );
    if (!hasImage) {
      imagelessPages++;
      missing.push({
        page: b.path.split("/")[1],
        label: b.label ?? "",
        section: b.section ?? "",
      });
    }
  }
  if (missing.length) {
    result.push({ slug: course.slug, title: course.title, missing });
  }
}

if (asJson) {
  console.log(JSON.stringify({ totalPages, imagelessPages, courses: result }, null, 2));
} else {
  for (const c of result) {
    console.log(`\n${c.title}  (${c.missing.length} image-less)`);
    for (const m of c.missing) {
      console.log(`  ${m.page.padEnd(4)} [${m.section}] ${m.label}`);
    }
  }
  console.log(
    `\n${imagelessPages}/${totalPages} pages have no image, across ${result.length} courses.`,
  );
}
