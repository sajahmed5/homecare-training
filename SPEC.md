# My Care Academy — Living Spec (SPEC.md)

> This is the source-of-truth product spec. **Read it first at the start of every phase.** Keep
> it updated as the product evolves. It is built in **phases** (0–10) — one phase at a time,
> tested and committed before moving on. See `my-care-academy-build-guide.md` for the full
> phased prompt pack.

---

## 1. Product summary

A **multi-tenant training platform (LMS)** for the UK care sector. My Care Academy (the platform
operator) invites care **organisations** onto the platform; each organisation trains its own
staff. Paid **Forms** and **Recruitment** add-ons are gated by package tier.

**Positioning:** compliance-first — CQC-ready training records, plus a proactive engine that
tells organisations who is falling behind *before* an inspector does.

### Roles

- **platform_admin** — My Care Academy staff. Global visibility across all orgs. Invite orgs,
  set packages/feature flags, view cross-org analytics, add other platform admins.
- **org_admin** — scoped to **one** organisation. Manage their staff, assign
  courses/pathways, view their org's engagement and compliance.
- **learner** — scoped to **themselves** within their org. Take courses, sit quizzes, download
  certificates.

---

## 2. Stack

| Layer | Choice |
|---|---|
| App framework | Next.js (App Router) + TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| Database + Auth + Storage | Supabase (Postgres), region **London / eu-west-2** (UK residency, fixed at creation) |
| Tenant isolation | Postgres **Row-Level Security (RLS)** |
| Auth claims for RLS | `organisation_id` + `role` exposed as **custom JWT claims** (Supabase auth hook) and/or a `SECURITY DEFINER` helper — **never** an RLS-policy subquery back into `users` |
| Payments / packages | Stripe (subscriptions + feature-gating add-ons) |
| Interactive courses | **Custom React interaction components** (drag-drop, fill-the-gap, image hotspot, MCQ slides) behind **one pluggable content interface**; course content stored as structured JSON blocks (H5P deliberately not used) |
| Certificates | Server-side PDF via **`@react-pdf/renderer`** (serverless-friendly), stored in Supabase Storage |
| Email | Resend (invites, reminders, scheduled reports) |
| Charts | Recharts |
| Hosting | Vercel (app) + Supabase (data) |
| Migrations | Supabase **CLI migrations + seed scripts** are the single source of truth |

**Cross-cutting requirements:** WCAG 2.2 AA accessibility; UK/EU data residency; feature-gating
enforced **server-side**, never UI-only; secrets only in `.env.local` (never committed).

---

## 3. Core feature flow

```
topics → courses → interactive content (JSON blocks) → quiz (random 20 of a 50-question bank,
pass at 80%) → certificate (with expiry & renewal)
```

- A **course** carries `expiry_months` (admin-editable, 0 = never). This drives certificate
  expiry and automatic re-training.
- The **quiz** is 20 questions drawn at random from the course's bank; pass mark **80%**;
  unlimited retakes on fail. **Not resumable** — once started it must be finished in one sitting.
- **Course content is resumable** (leave and come back); **the quiz is not**.
- **Every pass issues a fresh certificate** with a new expiry measured from that completion date
  — including voluntary early re-takes (which renew the learner). A learner may hold several
  certificates for one course over time; the **most recent pass is the source of truth** for
  compliance status and expiry.
- When a certificate expires, the enrolment flips to **expired** and the course shows as
  **required again** on the learner's dashboard (content + quiz must be redone).

---

## 4. Paid add-ons (gated by package tier)

- **Forms builder** — field types (text, number, date, select, radio, checkbox, file upload,
  signature) with **conditional logic** (show/hide/require a field based on another's answer),
  stored as JSON per field. Templates, assignment, submissions, CSV/PDF export. Visible only
  when `forms_enabled`.
- **Recruitment tracker** — applicant-tracking table with a document column per required item,
  candidate stages, Hired/Rejected status, ZIP download of a candidate's documents, and
  document-expiry tracking (DBS, right-to-work). Marking a candidate Hired can create them as a
  learner and auto-enrol them in the induction pathway. Visible only when `recruitment_enabled`.

---

## 5. Data model (summary)

**Standing conventions — every table:** `created_at` + `updated_at`; an index on
`organisation_id` (RLS filters on it constantly). Every tenant-scoped table carries
`organisation_id`, and RLS ensures `org_admin`/`learner` touch only their own org's rows while
`platform_admin` sees all.

- `organisations` — tenants. `package_tier`, `forms_enabled`, `recruitment_enabled`,
  `white_label_logo`, status.
- `users` — `organisation_id`, `role` (enum: platform_admin | org_admin | learner),
  `full_name`, `email`, MFA fields.
- `topics` — e.g. "Health & Safety".
- `courses` — `topic_id`, `title`, `content_blocks` (JSON: ordered slides + custom interaction
  blocks), `expiry_months` (0 = never).
- `pathways` + `pathway_courses` — course bundles (e.g. "Care Certificate Induction").
- `enrolments` — `user_id`, `course_id`, `status` (not_started | in_progress | completed |
  **expired**), `progress`, `time_spent`, `due_date`, `completion_count`, `attempt_count`.
- `quiz_questions` — `course_id`, MCQ bank (aim 50 per course).
- `quiz_attempts` — one row per attempt: random-20 selection, `score`, `passed`, `started_at`,
  `submitted_at`. Never resumable.
- `certificates` — `user_id`, `course_id`, `issued_at`, `expires_at`, `pdf_url`. Multiple per
  user/course over time (newest = live).
- `forms`, `form_fields` (conditional-logic JSON), `form_submissions`.
- `candidates`, `candidate_documents`, `candidate_stages` (recruitment).
- `audit_logs`, `report_schedules`.

---

## 6. Topics & seed courses (26)

**Care Fundamentals** — 1. Introduction to Care · 2. Duty of Care · 3. Person-Centred Care ·
4. Privacy & Dignity · 5. Communication Skills · 6. Equality, Diversity & Inclusion

**Safeguarding** — 7. Safeguarding Adults Level 2 · 8. Safeguarding Children · 9. Mental
Capacity Act & DoLS · 25. Whistleblowing

**Health & Safety** — 11. Health & Safety · 12. Fire Safety · 20. COSHH · 21. Slips, Trips &
Falls · 17. Lone Working · 22. Accident & Incident Reporting · **26. Moving & Handling (Manual
Handling)**

**Infection & Clinical** — 10. Infection Prevention & Control · 13. Food Hygiene & Nutrition ·
14. Medication Awareness · 18. Basic Life Support (BLS) · 19. First Aid Awareness

**Governance & Records** — 15. Record Keeping & Documentation · 16. Information Governance & GDPR

**Person & Service Quality** — 23. Conflict Resolution · 24. Complaints Handling

**Suggested expiry (`expiry_months`, editable):** BLS/First Aid = 12; Safeguarding, Fire,
Infection Control, Moving & Handling = 12; most others = 24–36. When a certificate expires the
course becomes required again for that learner.

---

## 7. Build phases (overview)

0. **Project setup & spec** — scaffold, this SPEC, Supabase client, git. *(current)*
1. **Foundation** — 1a: schema + RLS (via JWT claims) + basic auth; 1b: magic-link invites + MFA.
2. **Platform admin console** — orgs, feature flags, cross-org analytics.
3. **Org admin console** — staff, assignments, engagement/compliance, CSV/PDF export.
4. **Course structure & learner player** — topics/courses/pathways, custom interactive content.
5. **Quizzes & certificates** — random-20 quiz, pass/fail logic, PDF certs, verification page.
6. **Reports, reminders & renewals** — the proactive engine (differentiator).
7. **Forms add-on** (paid).
8. **Recruitment tracker** (paid).
9. **Billing, packages & feature-gating** — Stripe.
10. **Security hardening & go-live** — RLS audit, MFA, audit logs, UK-GDPR, runbook.

---

## 8. Environment variables

| Variable | Purpose | Secret? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (`https://khocrtocozzpayvelvhk.supabase.co`) | No |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key | No (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side admin key | **Yes** |
| `STRIPE_SECRET_KEY` | Stripe API (Phase 9) | **Yes** |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing (Phase 9) | **Yes** |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe.js (Phase 9) | No |
| `RESEND_API_KEY` | Email (Phase 1b onward) | **Yes** |

Put values only in `.env.local` (git-ignored). Never commit secret values.
