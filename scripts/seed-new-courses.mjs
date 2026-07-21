// Insert new courses that don't exist yet — additive and safe.
//
//   node scripts/seed-new-courses.mjs
//
// Unlike seed-catalogue.mjs, this NEVER touches an existing course. It inserts
// only rows whose slug is not already present, reading content_blocks from the
// committed scripts/blocks/<slug>.json snapshot. Safe to re-run.
//
// Deploy the page files first: this points the shared DB at pages that must
// already be live, so a fresh self-enrol cannot 404.
import { config } from "dotenv";
config({ path: ".env.local" });
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

// The three Care Certificate standards we had no course for. Descriptions carry
// the knowledge-only / employer-sign-off compliance line.
const NEW_COURSES = [
  {
    slug: "personal-development",
    topic: "Care Fundamentals",
    expiry_months: 24,
    description:
      "Care Certificate Standard 2 — reflective practice, supervision, appraisal and building your development plan. This covers the knowledge element only; your employer must also observe your competence at work and sign it off.",
  },
  {
    slug: "mental-health-and-dementia",
    topic: "Care Fundamentals",
    expiry_months: 24,
    description:
      "Care Certificate Standard 9 — awareness of mental health conditions and dementia, supporting people well, and recognising delirium. Knowledge element only; employer observation and sign-off are also required.",
  },
  {
    slug: "learning-disability-and-autism",
    topic: "Care Fundamentals",
    expiry_months: 24,
    description:
      "Care Certificate Standard 16 — awareness of learning disability and autism, reasonable adjustments and the law. This is awareness only and is NOT the Oliver McGowan Mandatory Training, which your employer must arrange separately.",
  },
  {
    slug: "fluids-and-nutrition",
    topic: "Care Fundamentals",
    expiry_months: 24,
    description:
      "Care Certificate Standard 8 — supporting people to have enough to eat and drink: hydration, malnutrition, swallowing difficulties and person-centred mealtime support. This covers the knowledge element only; your employer must also observe your competence at work and sign it off.",
  },
  {
    slug: "end-of-life-care",
    topic: "Person & Service Quality",
    expiry_months: 24,
    description:
      "Awareness of palliative and end of life care — supporting comfort, dignity and the person's wishes in the last months and days of life. Awareness only; end of life care is delivered by the wider team and does not replace supervised training.",
  },
  {
    slug: "catheter-care",
    topic: "Infection & Clinical",
    expiry_months: 24,
    description:
      "Awareness of urinary catheter care and infection prevention. Awareness only — catheter care is a delegated clinical task you may carry out only after task-specific training, assessed competence and delegation by a registered nurse.",
  },
  {
    slug: "continence-care",
    topic: "Infection & Clinical",
    expiry_months: 24,
    description:
      "Promoting continence and delivering dignified, person-centred continence care. Awareness only; continence assessment and products are directed by a nurse or continence advisor.",
  },
  {
    slug: "personal-care",
    topic: "Person & Service Quality",
    expiry_months: 24,
    description:
      "Delivering personal care with dignity, privacy and consent — washing, oral care, grooming, dressing and skin care. Covers the knowledge element; your employer must also observe your competence at work.",
  },
  {
    slug: "oral-care",
    topic: "Infection & Clinical",
    expiry_months: 24,
    description:
      "Awareness of daily mouth care — why it matters for health and dignity, good technique, denture care and recognising problems. Awareness only; dental assessment and treatment are for dental professionals.",
  },
  {
    slug: "peg-feeding",
    topic: "Infection & Clinical",
    expiry_months: 24,
    description:
      "Awareness of PEG (enteral) feeding — safe practice, positioning, tube and stoma-site care and recognising complications. Awareness only — a delegated clinical task you may carry out only after task-specific training, assessed competence and delegation by a registered nurse or dietitian.",
  },
  {
    slug: "stoma-care",
    topic: "Infection & Clinical",
    expiry_months: 24,
    description:
      "Awareness of stoma care — types of stoma, appliances and daily care, skin health and recognising complications. Awareness only; supported stoma care may be delegated after training, and the stoma nurse leads assessment.",
  },
  {
    slug: "tracheostomy-awareness",
    topic: "Infection & Clinical",
    expiry_months: 24,
    description:
      "Awareness of tracheostomy care — how it changes breathing, keeping the person safe, and recognising and responding to emergencies. Awareness only — you must not suction or change a tracheostomy tube without specific training, assessed competence and delegation.",
  },
  {
    slug: "care-planning",
    topic: "Person & Service Quality",
    expiry_months: 24,
    description:
      "Contributing to, following and reviewing person-centred care plans — assessment, outcomes, involvement, capacity and keeping records accurate. Awareness only; formal assessment sits with your assessor.",
  },
  {
    slug: "sepsis",
    topic: "Infection & Clinical",
    expiry_months: 24,
    description:
      "Recognising the signs of sepsis early and escalating fast. Awareness to help you spot \"could this be sepsis?\" and get urgent help — it does not replace clinical assessment.",
  },
  {
    slug: "stroke-awareness",
    topic: "Infection & Clinical",
    expiry_months: 24,
    description:
      "Recognising a stroke with the FAST test and acting immediately, plus supporting recovery. Awareness only; a suspected stroke means calling 999 at once.",
  },
  {
    slug: "diabetes-awareness",
    topic: "Infection & Clinical",
    expiry_months: 24,
    description:
      "Supporting people living with diabetes and recognising and responding to hypo and hyper emergencies. Awareness only — administering insulin or diabetes medication needs specific training, competence and delegation.",
  },
  {
    slug: "epilepsy-awareness",
    topic: "Infection & Clinical",
    expiry_months: 24,
    description:
      "Understanding epilepsy, giving safe seizure first aid and recognising emergencies. Awareness only; rescue medication is given only with specific training, competence and an individual protocol.",
  },
  {
    slug: "anxiety-awareness",
    topic: "Care Fundamentals",
    expiry_months: 24,
    description:
      "Awareness of anxiety and anxiety disorders — the signs, supporting someone (including through a panic attack) and encouraging help. Awareness only; it does not replace professional mental health assessment or treatment.",
  },
  {
    slug: "depression-awareness",
    topic: "Care Fundamentals",
    expiry_months: 24,
    description:
      "Awareness of depression — recognising the signs, supporting someone and responding to risk. Awareness only; any risk of self-harm or suicide must be escalated urgently, and it does not replace professional treatment.",
  },
  {
    slug: "eating-disorders",
    topic: "Care Fundamentals",
    expiry_months: 24,
    description:
      "Awareness of eating disorders — types, warning signs, myths and how to support someone with dignity. Awareness only; early professional help matters and this does not replace assessment or treatment.",
  },
  {
    slug: "communication-support",
    topic: "Care Fundamentals",
    expiry_months: 24,
    description:
      "Supporting people with additional communication needs — barriers, total communication, tools and aids, and person-centred practice. Awareness only; speech and language therapists assess and advise.",
  },
  {
    slug: "lgbtq-awareness",
    topic: "Care Fundamentals",
    expiry_months: 24,
    description:
      "LGBTQ+ awareness for care — inclusive, respectful, person-centred support, understanding identity, and challenging discrimination. Awareness and good practice; follows your organisation's equality and inclusion policies.",
  },
  {
    slug: "dyslexia-awareness",
    topic: "Care Fundamentals",
    expiry_months: 24,
    description:
      "Awareness of dyslexia — how it affects people, recognising signs, and practical reasonable adjustments to support the people you support and colleagues. Awareness only; it does not replace a formal assessment.",
  },
  {
    slug: "positive-behaviour-support",
    topic: "Person & Service Quality",
    expiry_months: 24,
    description:
      "An introduction to Positive Behaviour Support — behaviour as communication of unmet need, proactive person-centred strategies and least-restrictive practice. Awareness only; PBS plans are led by trained professionals.",
  },
  {
    slug: "behaviours-that-challenge",
    topic: "Person & Service Quality",
    expiry_months: 24,
    description:
      "Understanding and responding to behaviour that challenges — distress and unmet need, de-escalation, and keeping everyone safe. Awareness only; physical intervention needs specific training and is a last resort.",
  },
  {
    slug: "duty-of-candour",
    topic: "Governance & Records",
    expiry_months: 24,
    description:
      "The duty of candour — being open and honest when things go wrong. Awareness of CQC Regulation 20 and the professional duty; the organisation makes the formal notifications. Awareness only.",
  },
  {
    slug: "modern-slavery",
    topic: "Safeguarding",
    expiry_months: 24,
    description:
      "Modern slavery awareness — the types, recognising the signs and how to report safely. Awareness only; specialist agencies investigate and this does not replace your safeguarding policy.",
  },
  {
    slug: "risk-assessment",
    topic: "Health & Safety",
    expiry_months: 24,
    description:
      "Risk assessment awareness — hazard vs risk, the HSE five steps, control measures and dynamic and positive risk-taking. Awareness only; formal assessments sit with a competent person.",
  },
  {
    slug: "legionnaires-disease",
    topic: "Health & Safety",
    expiry_months: 24,
    description:
      "Legionella awareness — what Legionnaires' disease is, where the risk comes from and how it is controlled. Awareness only; the legionella risk assessment sits with the responsible person.",
  },
];

const { data: topics } = await sb.from("topics").select("id, title");
const topicId = (name) => topics.find((t) => t.title === name)?.id ?? null;

const { data: maxRow } = await sb
  .from("courses")
  .select("sort_order")
  .order("sort_order", { ascending: false })
  .limit(1);
let sortOrder = (maxRow?.[0]?.sort_order ?? 0) + 1;

let inserted = 0;
for (const c of NEW_COURSES) {
  const { data: existing } = await sb
    .from("courses")
    .select("id")
    .eq("slug", c.slug)
    .maybeSingle();
  if (existing) {
    console.log(`• ${c.slug} already exists — skipped`);
    continue;
  }

  const block = JSON.parse(readFileSync(`scripts/blocks/${c.slug}.json`, "utf8"));
  const { error } = await sb.from("courses").insert({
    topic_id: topicId(c.topic),
    title: block.title,
    slug: c.slug,
    description: c.description,
    content_blocks: block.content_blocks,
    expiry_months: c.expiry_months,
    sort_order: sortOrder++,
  });
  if (error) {
    console.error(`✗ ${c.slug}: ${error.message}`);
    continue;
  }
  console.log(`✓ inserted ${block.title} (${block.content_blocks.length} pages)`);
  inserted++;
}
console.log(`\nInserted ${inserted} new course(s).`);
