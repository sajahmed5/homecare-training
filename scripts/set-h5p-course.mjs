// Point a course's content at a single full-module H5P package.
//   node scripts/set-h5p-course.mjs "Communication Skills" communication-skills
import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const [title, path] = process.argv.slice(2);
if (!title || !path) {
  console.error('Usage: node scripts/set-h5p-course.mjs "<Course title>" <h5p-folder>');
  process.exit(1);
}

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const blocks = [{ type: "h5p", path, label: "Interactive module" }];

const { data, error } = await admin
  .from("courses")
  .update({ content_blocks: blocks })
  .eq("title", title)
  .select("id, title");

if (error) {
  console.error("Update failed:", error.message);
  process.exit(1);
}
if (!data?.length) {
  console.error(`No course titled "${title}" found.`);
  process.exit(1);
}
console.log(`Updated ${data.length} course(s):`, data.map((c) => c.title).join(", "));
