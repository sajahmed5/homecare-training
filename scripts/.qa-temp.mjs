import { config } from "dotenv"; config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "node:fs";
const a = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const SLUG = "slips-trips-and-falls";
const { data: u } = await a.from("users").select("id,organisation_id").eq("email","qa@demo-care.test").single();
const { data: c } = await a.from("courses").select("id,title").eq("slug",SLUG).single();
const { data: e } = await a.from("enrolments").select("*").eq("user_id",u.id).eq("course_id",c.id).single();
// save original so we can restore exactly
writeFileSync("/tmp/qa-orig-enrolment.json", JSON.stringify({ id:e.id, status:e.status, progress:e.progress, completion_count:e.completion_count }));
await a.from("enrolments").update({ status:"completed", progress:100, completion_count:(e.completion_count??0)+1 }).eq("id", e.id);
const certNo = "MCA-QA-TEMPVERIFY";
await a.from("certificates").delete().eq("certificate_number", certNo);
const { error } = await a.from("certificates").insert({
  certificate_number: certNo, organisation_id: u.organisation_id, user_id: u.id,
  course_id: c.id, issued_at: new Date().toISOString(),
});
console.log(error ? "cert insert error: "+error.message : `TEMP: ${c.title} marked completed + cert issued`);
console.log("original saved:", JSON.stringify({status:e.status, progress:e.progress, completion_count:e.completion_count}));
