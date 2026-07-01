// Seed a starter question bank for each course (only for courses that have none,
// so it never overwrites questions edited in the platform console). Grow each
// bank toward ~50 from the UI.
//
//   node scripts/seed-questions.mjs

import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

// Generic care-practice questions. `title` is woven into a couple of them.
function starterBank(title) {
  return [
    {
      question: `What is the main aim of ${title}?`,
      options: [
        "To keep the people you support safe and well",
        "To create more paperwork",
        "To avoid talking to colleagues",
        "To work as quickly as possible",
      ],
      answer_index: 0,
    },
    {
      question: "If you are unsure how to carry out a task safely, you should:",
      options: [
        "Guess and hope for the best",
        "Ask a senior colleague or your manager",
        "Skip the task",
        "Ask the person you support to do it",
      ],
      answer_index: 1,
    },
    {
      question: "Person-centred care means:",
      options: [
        "Everyone gets exactly the same care",
        "Care is built around the individual's needs, wishes and preferences",
        "The care worker decides what is best",
        "Family are never involved",
      ],
      answer_index: 1,
    },
    {
      question: "You notice a potential hazard in the workplace. You should:",
      options: [
        "Ignore it if you are busy",
        "Report it and, if safe, make the area safe",
        "Wait for someone else to notice",
        "Only mention it at your next supervision",
      ],
      answer_index: 1,
    },
    {
      question: "Keeping accurate records is important because:",
      options: [
        "It provides a clear account of the care given",
        "It is only for inspections",
        "It replaces talking to colleagues",
        "It is optional",
      ],
      answer_index: 0,
    },
    {
      question: "Confidential information about a person you support should be:",
      options: [
        "Shared freely with anyone",
        "Discussed in public areas",
        "Only shared with those who need it, on a need-to-know basis",
        "Posted on social media",
      ],
      answer_index: 2,
    },
    {
      question: "If someone refuses care, the right first step is to:",
      options: [
        "Force the care anyway",
        "Respect their choice, seek to understand why, and follow policy",
        "Ignore them and move on",
        "Tell them they must comply",
      ],
      answer_index: 1,
    },
    {
      question: "Good communication with the people you support includes:",
      options: [
        "Speaking over them",
        "Listening, checking understanding and adapting to their needs",
        "Using jargon",
        "Only writing things down",
      ],
      answer_index: 1,
    },
    {
      question: "If you make a mistake at work, you should:",
      options: [
        "Hide it",
        "Report it honestly so it can be put right and learned from",
        "Blame a colleague",
        "Wait to see if anyone notices",
      ],
      answer_index: 1,
    },
    {
      question: `Which statement best reflects safe practice in ${title}?`,
      options: [
        "Follow your training and organisation's policies",
        "Do whatever feels easiest at the time",
        "Never ask questions",
        "Keep concerns to yourself",
      ],
      answer_index: 0,
    },
  ];
}

async function main() {
  const { data: courses, error } = await admin
    .from("courses")
    .select("id, title");
  if (error) throw error;

  let seeded = 0;
  let skipped = 0;
  for (const course of courses) {
    const { count } = await admin
      .from("quiz_questions")
      .select("id", { count: "exact", head: true })
      .eq("course_id", course.id);
    if ((count ?? 0) > 0) {
      skipped += 1;
      continue;
    }
    const rows = starterBank(course.title).map((q, i) => ({
      course_id: course.id,
      question: q.question,
      options: q.options,
      answer_index: q.answer_index,
      sort_order: i,
    }));
    const { error: insErr } = await admin.from("quiz_questions").insert(rows);
    if (insErr) throw insErr;
    seeded += 1;
  }
  console.log(`seeded ${seeded} course bank(s), skipped ${skipped} (already had questions)`);
}

main().then(
  () => console.log("question banks seeded ✓"),
  (e) => {
    console.error("seed failed:", e.message);
    process.exit(1);
  },
);
