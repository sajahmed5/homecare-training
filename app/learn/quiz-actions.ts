"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateCertificatePdf } from "@/lib/certificate";
import {
  QUIZ_TARGET,
  PASS_PERCENT,
  makeCertificateNumber,
  computeExpiry,
  gradeAnswer,
  toPublicQuestion,
  type PublicQuestion,
  type StoredQuestion,
} from "@/lib/quiz";

export interface StartQuizResult {
  ok: boolean;
  error?: string;
  attemptId?: string;
  questions?: PublicQuestion[];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Begin an attempt: pick random questions, record started_at, return questions (no answers). */
export async function startQuizAction(
  courseId: string,
): Promise<StartQuizResult> {
  const context = await requireRole("learner");

  // Confirm the learner is actually enrolled (RLS scopes to their own row).
  const supabase = await createClient();
  const { data: enrolment } = await supabase
    .from("enrolments")
    .select("id, organisation_id")
    .eq("course_id", courseId)
    .maybeSingle();
  if (!enrolment) return { ok: false, error: "You are not enrolled on this course." };

  const admin = createAdminClient();
  const { data: bank } = await admin
    .from("quiz_questions")
    .select("id, type, question, options, answer_index, payload")
    .eq("course_id", courseId);

  if (!bank || bank.length === 0) {
    return { ok: false, error: "This course has no assessment questions yet." };
  }

  const selected = shuffle(bank as StoredQuestion[]).slice(
    0,
    Math.min(QUIZ_TARGET, bank.length),
  );

  const { data: attempt, error } = await admin
    .from("quiz_attempts")
    .insert({
      organisation_id: enrolment.organisation_id,
      user_id: context.userId,
      course_id: courseId,
      question_ids: selected.map((q) => q.id),
    })
    .select("id")
    .single();
  if (error || !attempt) {
    return { ok: false, error: "Could not start the assessment." };
  }

  // Send an answer-stripped projection — correct answers never leave the server.
  return {
    ok: true,
    attemptId: attempt.id,
    questions: selected.map(toPublicQuestion),
  };
}

export interface SubmitQuizResult {
  ok: boolean;
  error?: string;
  score?: number;
  correct?: number;
  total?: number;
  passed?: boolean;
  certificateId?: string;
}

/** Grade an attempt server-side, update counters, and issue a certificate on a pass. */
export async function submitQuizAction(
  attemptId: string,
  answers: Record<string, unknown>,
): Promise<SubmitQuizResult> {
  const context = await requireRole("learner");
  const admin = createAdminClient();

  const { data: attempt } = await admin
    .from("quiz_attempts")
    .select("id, user_id, course_id, organisation_id, question_ids, submitted_at")
    .eq("id", attemptId)
    .single();
  if (!attempt || attempt.user_id !== context.userId) {
    return { ok: false, error: "Attempt not found." };
  }
  if (attempt.submitted_at) {
    return { ok: false, error: "This attempt has already been submitted." };
  }

  const questionIds = attempt.question_ids as string[];
  const { data: questions } = await admin
    .from("quiz_questions")
    .select("id, type, question, options, answer_index, payload")
    .in("id", questionIds);

  // Grade every question server-side against the stored answer key (per type).
  const byId = new Map<string, StoredQuestion>(
    (questions ?? []).map((q) => [q.id as string, q as StoredQuestion]),
  );
  let correct = 0;
  for (const id of questionIds) {
    const q = byId.get(id);
    if (q && gradeAnswer(q, answers[id])) correct += 1;
  }
  const total = questionIds.length;
  const score = total > 0 ? Math.round((correct / total) * 100) : 0;
  const passed = score >= PASS_PERCENT;

  await admin
    .from("quiz_attempts")
    .update({ answers, score, passed, submitted_at: new Date().toISOString() })
    .eq("id", attemptId);

  // Update enrolment counters (every attempt counts; a pass completes + renews).
  const { data: enrolment } = await admin
    .from("enrolments")
    .select("id, attempt_count, completion_count")
    .eq("user_id", context.userId)
    .eq("course_id", attempt.course_id)
    .single();

  if (enrolment) {
    await admin
      .from("enrolments")
      .update({
        attempt_count: (enrolment.attempt_count ?? 0) + 1,
        ...(passed
          ? {
              completion_count: (enrolment.completion_count ?? 0) + 1,
              status: "completed",
              progress: 100,
            }
          : {}),
      })
      .eq("id", enrolment.id);
  }

  let certificateId: string | undefined;
  if (passed) {
    certificateId = await issueCertificate({
      admin,
      userId: context.userId,
      organisationId: attempt.organisation_id as string,
      courseId: attempt.course_id as string,
    });
  }

  revalidatePath("/learn");
  return { ok: true, score, correct, total, passed, certificateId };
}

async function issueCertificate({
  admin,
  userId,
  organisationId,
  courseId,
}: {
  admin: ReturnType<typeof createAdminClient>;
  userId: string;
  organisationId: string;
  courseId: string;
}): Promise<string | undefined> {
  const [{ data: learner }, { data: course }] = await Promise.all([
    admin.from("users").select("full_name, email").eq("id", userId).single(),
    admin
      .from("courses")
      .select("title, expiry_months")
      .eq("id", courseId)
      .single(),
  ]);
  if (!course) return undefined;

  const issuedAt = new Date();
  const expiresAt = computeExpiry(issuedAt, course.expiry_months ?? 0);

  const { data: cert, error } = await admin
    .from("certificates")
    .insert({
      certificate_number: makeCertificateNumber(crypto.randomUUID()),
      organisation_id: organisationId,
      user_id: userId,
      course_id: courseId,
      issued_at: issuedAt.toISOString(),
      expires_at: expiresAt ? expiresAt.toISOString() : null,
    })
    .select("id, certificate_number")
    .single();
  if (error || !cert) return undefined;

  try {
    const pdf = await generateCertificatePdf({
      learnerName: learner?.full_name || learner?.email || "Learner",
      courseTitle: course.title as string,
      certificateNumber: cert.certificate_number as string,
      issuedAt,
      expiresAt,
    });
    const path = `${userId}/${cert.id}.pdf`;
    await admin.storage
      .from("certificates")
      .upload(path, pdf, { contentType: "application/pdf", upsert: true });
    await admin.from("certificates").update({ pdf_path: path }).eq("id", cert.id);
  } catch (e) {
    console.error("Certificate PDF generation failed:", e);
  }

  return cert.id;
}

/** Signed URL to download a certificate PDF (learner must own it). */
export async function getCertificateUrlAction(
  certificateId: string,
): Promise<{ url?: string; error?: string }> {
  const context = await requireRole("learner");

  // RLS ensures the learner can only read their own certificate.
  const supabase = await createClient();
  const { data: cert } = await supabase
    .from("certificates")
    .select("pdf_path, user_id")
    .eq("id", certificateId)
    .maybeSingle();
  if (!cert || cert.user_id !== context.userId || !cert.pdf_path) {
    return { error: "Certificate not available." };
  }

  const admin = createAdminClient();
  const { data } = await admin.storage
    .from("certificates")
    .createSignedUrl(cert.pdf_path, 60);
  return { url: data?.signedUrl };
}
