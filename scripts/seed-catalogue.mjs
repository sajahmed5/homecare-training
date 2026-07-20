// Idempotent catalogue seed — topics, the 26 courses (with placeholder content
// blocks), and the Care Certificate Induction pathway. Run with the service role:
//
//   node scripts/seed-catalogue.mjs
//
// Real course content is authored separately; these blocks exist so the player
// has something to render.

import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

// DESTRUCTIVE: this upserts every course by slug INCLUDING placeholder
// content_blocks, so re-running against the shared production DB replaces all
// 26 authored courses with empty placeholder slides. It exists only for a
// from-scratch bootstrap. Require an explicit acknowledgement flag.
if (!process.argv.includes("--i-know-this-destroys-content")) {
  console.error(
    [
      "REFUSING TO RUN. seed-catalogue.mjs overwrites courses.content_blocks with",
      "placeholder slides for all 26 courses — it would wipe the authored content",
      "in the SHARED PRODUCTION database.",
      "",
      "This is a from-scratch bootstrap only. If that is genuinely what you want,",
      "re-run with:  node scripts/seed-catalogue.mjs --i-know-this-destroys-content",
    ].join("\n"),
  );
  process.exit(1);
}

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const slug = (s) =>
  s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const TOPICS = [
  "Care Fundamentals",
  "Safeguarding",
  "Health & Safety",
  "Infection & Clinical",
  "Governance & Records",
  "Person & Service Quality",
];

// [topic, title, expiry_months]
const COURSES = [
  ["Care Fundamentals", "Introduction to Care", 36],
  ["Care Fundamentals", "Duty of Care", 24],
  ["Care Fundamentals", "Person-Centred Care", 24],
  ["Care Fundamentals", "Privacy & Dignity", 24],
  ["Care Fundamentals", "Communication Skills", 24],
  ["Care Fundamentals", "Equality, Diversity & Inclusion", 36],
  ["Safeguarding", "Safeguarding Adults Level 2", 12],
  ["Safeguarding", "Safeguarding Children", 12],
  ["Safeguarding", "Mental Capacity Act & DoLS", 24],
  ["Safeguarding", "Whistleblowing", 24],
  ["Health & Safety", "Health & Safety", 24],
  ["Health & Safety", "Fire Safety", 12],
  ["Health & Safety", "COSHH", 24],
  ["Health & Safety", "Slips, Trips & Falls", 24],
  ["Health & Safety", "Lone Working", 24],
  ["Health & Safety", "Accident & Incident Reporting", 24],
  ["Health & Safety", "Moving & Handling", 12],
  ["Infection & Clinical", "Infection Prevention & Control", 12],
  ["Infection & Clinical", "Food Hygiene & Nutrition", 24],
  ["Infection & Clinical", "Medication Awareness", 24],
  ["Infection & Clinical", "Basic Life Support (BLS)", 12],
  ["Infection & Clinical", "First Aid Awareness", 12],
  ["Governance & Records", "Record Keeping & Documentation", 24],
  ["Governance & Records", "Information Governance & GDPR", 24],
  ["Person & Service Quality", "Conflict Resolution", 24],
  ["Person & Service Quality", "Complaints Handling", 24],
];

// Courses that make up the induction pathway.
const INDUCTION = [
  "Introduction to Care",
  "Duty of Care",
  "Person-Centred Care",
  "Communication Skills",
  "Equality, Diversity & Inclusion",
  "Safeguarding Adults Level 2",
  "Health & Safety",
  "Fire Safety",
  "Infection Prevention & Control",
  "Moving & Handling",
  "Basic Life Support (BLS)",
  "First Aid Awareness",
];

/** Placeholder content blocks so the player renders. Real content is authored later. */
function blocksFor(title) {
  return [
    {
      type: "slide",
      title: `Welcome to ${title}`,
      body: `This module introduces ${title}. By the end you'll understand the core principles and how they apply to your day-to-day work in a care setting.`,
    },
    {
      type: "slide",
      title: "Key principles",
      body: `Good practice in ${title} means putting the people you support first, following your organisation's policies, and knowing when to ask for help. Keep clear records and always act within your role.`,
    },
    {
      type: "mcq",
      question: `Which of the following best reflects good practice in ${title}?`,
      options: [
        "Follow policy, put the person first, and record what you do",
        "Do whatever is quickest",
        "Wait to be told before ever acting",
        "Keep concerns to yourself",
      ],
      answerIndex: 0,
    },
    {
      type: "fill_gap",
      text: "If you are ever unsure how to act, you should always ___ for guidance before continuing.",
      answers: ["ask"],
    },
    {
      type: "drag_drop",
      prompt: "Match each action to when it applies.",
      pairs: [
        { item: "Spot a hazard", match: "Report it" },
        { item: "Unsure of a task", match: "Ask for help" },
        { item: "Finish a task", match: "Record it" },
      ],
    },
  ];
}

async function main() {
  // Topics
  const topicIds = {};
  for (let i = 0; i < TOPICS.length; i++) {
    const title = TOPICS[i];
    const { data, error } = await admin
      .from("topics")
      .upsert({ title, slug: slug(title), sort_order: i }, { onConflict: "slug" })
      .select("id")
      .single();
    if (error) throw error;
    topicIds[title] = data.id;
  }
  console.log(`topics: ${Object.keys(topicIds).length}`);

  // Courses
  const courseIds = {};
  for (let i = 0; i < COURSES.length; i++) {
    const [topic, title, expiry] = COURSES[i];
    const { data, error } = await admin
      .from("courses")
      .upsert(
        {
          topic_id: topicIds[topic],
          title,
          slug: slug(title),
          description: `${title} — a core module for UK care staff.`,
          content_blocks: blocksFor(title),
          expiry_months: expiry,
          sort_order: i,
        },
        { onConflict: "slug" },
      )
      .select("id")
      .single();
    if (error) throw error;
    courseIds[title] = data.id;
  }
  console.log(`courses: ${Object.keys(courseIds).length}`);

  // Induction pathway
  const { data: pathway, error: pErr } = await admin
    .from("pathways")
    .upsert(
      {
        title: "Care Certificate Induction",
        slug: "care-certificate-induction",
        description: "Core induction training for new care staff.",
      },
      { onConflict: "slug" },
    )
    .select("id")
    .single();
  if (pErr) throw pErr;

  const links = INDUCTION.map((title, i) => ({
    pathway_id: pathway.id,
    course_id: courseIds[title],
    sort_order: i,
  }));
  const { error: linkErr } = await admin
    .from("pathway_courses")
    .upsert(links, { onConflict: "pathway_id,course_id" });
  if (linkErr) throw linkErr;
  console.log(`pathway: Care Certificate Induction (${links.length} courses)`);
}

main().then(
  () => console.log("catalogue seeded ✓"),
  (e) => {
    console.error("seed failed:", e.message);
    process.exit(1);
  },
);
