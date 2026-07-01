# My Care Academy — Build Guide & Prompt Pack

A multi-tenant training platform (LMS) for the UK care sector, with paid Forms and Recruitment add-ons.

This document is written to be worked through **top to bottom** with **Claude Code**. Each phase has a goal and a ready-to-paste prompt. **Build one phase at a time, test it, then move on.** Do not paste the whole thing at once — a project this size must be built incrementally or it becomes impossible to debug.

---

## 0. Ground rules for working with Claude Code

1. **Keep a living spec.** The first prompt creates a `SPEC.md` in the repo. Every later prompt tells Claude to read it first. This is how the AI keeps context across sessions.
2. **One phase per session where you can.** Commit to git after each phase (`git commit -m "phase 3 complete"`) so you can always roll back.
3. **Test after every phase.** Ask Claude to write and run tests, and click through the feature yourself before continuing.
4. **Never paste real credentials into chat.** Put secrets in `.env.local`; Claude should reference variable names, never values.
5. **Schema lives in migrations.** Supabase **CLI migrations + seed scripts** are the single source of truth for the database — never hand-edit schema in the dashboard without a matching migration.
6. **Accessibility from day one.** Target **WCAG 2.2 AA** — a legal-adjacent expectation in UK care and a genuine selling point.
7. **Data residency.** The Supabase project is **Central EU / Frankfurt (`eu-central-1`)** — fixed at project creation and cannot be changed later. UK personal data is stored here lawfully under the UK–EU adequacy decision; if a buyer requires UK-only residency, the project must be recreated in London (`eu-west-2`).

---

## 1. Recommended stack

| Layer | Choice | Why |
|---|---|---|
| App framework | Next.js (App Router) + TypeScript | Full-stack, scales, excellent AI support |
| UI | Tailwind CSS + shadcn/ui | Fast, clean, consistent |
| Database + Auth + Storage | Supabase (Postgres) | Auth with MFA, file storage, and **Row-Level Security** for tenant isolation in one place |
| Tenant isolation | Postgres Row-Level Security (RLS) | Guarantees one org can never read another's data |
| Payments / packages | Stripe | Subscriptions + feature-gating add-ons |
| Interactive courses | Custom React components (drag-drop, fill-the-gap, hotspot, MCQ slides) behind a pluggable content interface | Fully in-stack, no PHP/H5P hosting burden; the interface lets us swap engines later |
| Certificates | Server-side PDF (`@react-pdf/renderer`) | Branded, downloadable, serverless-friendly on Vercel |
| Email | Resend or Postmark | Invites, reminders, scheduled reports |
| Charts | Recharts or Tremor | Analytics dashboards |
| Hosting | Vercel (app) + Supabase (data) | Scales automatically |

---

## 2. Roles & access model

- **platform_admin** — My Care Academy staff. Global visibility. Invite orgs, set packages/feature flags, cross-org analytics.
- **org_admin** — scoped to ONE organisation. Manage their staff, assign courses/pathways, view their org's engagement.
- **learner** — scoped to themselves within their org. Take courses, sit quizzes, download certificates.

Every table carries an `organisation_id`. RLS policies enforce that `org_admin` and `learner` can only ever touch rows for their own org; `platform_admin` bypasses via a policy check on their role.

---

## 3. Core data model (summary)

> **Standing conventions (apply to every table):** carry `created_at` and `updated_at`
> timestamps, and an index on `organisation_id` (RLS filters on it constantly, so it must be
> indexed for performance).

- `organisations` — the tenants. Columns include `package_tier`, `forms_enabled`, `recruitment_enabled`, `white_label_logo`.
- `users` — `organisation_id`, `role`, `full_name`, `email`, MFA fields.
- `topics` — e.g. "Health & Safety".
- `courses` — `topic_id`, `title`, `content_blocks` (JSON: ordered slides + custom interaction blocks), `expiry_months` (admin-editable per course; 0 = never expires). This drives certificate expiry and re-training.
- `pathways` + `pathway_courses` — bundles (e.g. "Care Certificate Induction").
- `enrolments` — `user_id`, `course_id`, `status` (not_started / in_progress / completed / **expired**), `progress`, `time_spent`, `due_date`, `completion_count` (times this user has passed the course), `attempt_count` (total attempts including fails).
- `quiz_questions` — `course_id`, question bank (aim 50 per course).
- `quiz_attempts` — one row per attempt: random-20 selection, `score`, `passed`, `started_at`, `submitted_at`. Never resumable — an attempt that is started must be submitted in the same sitting.
- `certificates` — `user_id`, `course_id`, `issued_at`, `expires_at`, `pdf_url`. A user can hold multiple certificates for the same course over time (repeat completions and renewals).
- `forms`, `form_fields` (with conditional-logic JSON), `form_submissions`.
- `candidates`, `candidate_documents`, `candidate_stages` (recruitment).
- `audit_logs`, `report_schedules`.

---

## 4. Seed data — your topics & courses

Group the 26 courses into these topics (Moving & Handling, course #26, is CQC-mandatory and
was missing from the original list):

**Care Fundamentals**
1. Introduction to Care · 2. Duty of Care · 3. Person-Centred Care · 4. Privacy & Dignity · 5. Communication Skills · 6. Equality, Diversity & Inclusion

**Safeguarding**
7. Safeguarding Adults Level 2 · 8. Safeguarding Children · 9. Mental Capacity Act & DoLS · 25. Whistleblowing

**Health & Safety**
11. Health & Safety · 12. Fire Safety · 20. COSHH · 21. Slips, Trips & Falls · 17. Lone Working · 22. Accident & Incident Reporting · 26. Moving & Handling (Manual Handling)

**Infection & Clinical**
10. Infection Prevention & Control · 13. Food Hygiene & Nutrition · 14. Medication Awareness · 18. Basic Life Support (BLS) · 19. First Aid Awareness

**Governance & Records**
15. Record Keeping & Documentation · 16. Information Governance & GDPR

**Person & Service Quality**
23. Conflict Resolution · 24. Complaints Handling

Suggested expiry periods (set per course as `expiry_months`, editable any time; when a certificate expires the course automatically becomes "required" again for that learner): BLS/First Aid = 12 months; Safeguarding, Fire, Infection Control, Moving & Handling = 12 months; most others = 24–36 months.

---

# THE PROMPT PACK

Paste these into Claude Code one at a time.

---

## Phase 0 — Project setup & spec

```
I'm building "My Care Academy", a multi-tenant training platform (LMS) for the UK
care sector. Before writing code, create a file SPEC.md that captures the full
product. Include:

- Product summary: a multi-tenant LMS where My Care Academy invites care
  organisations to use the platform. Three roles: platform_admin (My Care Academy
  staff, global visibility), org_admin (scoped to one organisation), learner
  (scoped to themselves).
- Stack: Next.js (App Router) + TypeScript + Tailwind + shadcn/ui; Supabase for
  Postgres, Auth (with MFA) and Storage; Postgres Row-Level Security for tenant
  isolation; Stripe for packages and feature-gating; custom React interaction
  components (behind a pluggable content interface) for interactive course content;
  server-side PDF (@react-pdf/renderer) for certificates; Resend for email; Vercel
  hosting.
- Core features: topics -> courses -> interactive content -> quiz (random 20 of a
  50-question bank, pass at 80%) -> certificate with expiry/renewal.
- Paid add-ons gated by package tier: a Forms builder (conditional logic) and a
  Recruitment tracker.
- The data model in section 3 of my build guide (I'll paste it).
- A note that the whole product will be built in phases.

Then scaffold the Next.js + TypeScript + Tailwind + shadcn/ui project, initialise
git, and set up a Supabase client. Don't build features yet — just the skeleton,
the SPEC.md, and a README explaining how to run it locally. List the environment
variables I need to create.
```

## Phase 1 — Foundation: auth, roles, multi-tenancy, org invites

> **Split this phase into 1a and 1b — build and test each independently.**
>
> **Critical RLS-auth rule:** `organisation_id` and `role` must be available to RLS policies
> via **custom JWT claims (a Supabase auth hook / `custom_access_token_hook`)** and/or a
> `SECURITY DEFINER` helper function that reads the caller's org — **never** via a subquery from
> a policy back into the RLS-protected `users` table. That pattern recurses and can leak. Nail
> this in 1a; everything downstream depends on it.

**Phase 1a — schema + RLS + basic auth**

```
Read SPEC.md. Build the foundation (part 1a):

1. Supabase schema with organisations and users tables plus the enum roles
   (platform_admin, org_admin, learner). organisations has package_tier,
   forms_enabled, recruitment_enabled. Every table has created_at/updated_at and an
   index on organisation_id.
2. Expose organisation_id and role as custom JWT claims via a Supabase auth hook
   (custom_access_token_hook), and add a SECURITY DEFINER helper to read the
   caller's org/role. Do NOT let RLS policies subquery the users table directly.
3. Row-Level Security policies (using the claims/helper from step 2) so org_admin
   and learner can only access rows where organisation_id matches their own org, and
   platform_admin can access all.
4. Auth: email/password sign-in and the correct-dashboard-by-role redirect
   middleware.

Write tests for the RLS policies proving cross-org access is blocked. Explain how
to run the migrations.
```

**Phase 1b — invites + MFA**

```
Read SPEC.md. Build the foundation (part 1b):

1. Magic-link invite flow: a platform_admin can invite an organisation (creates the
   org + its first org_admin, who gets an email invite). An org_admin can invite
   learners into their own org.
2. Enforce MFA (TOTP) for platform_admin and org_admin: require AAL2 in middleware
   for admin routes; prompt enrolment on first admin sign-in.

Test the invite flow end-to-end and that an admin without AAL2 cannot reach admin
routes.
```

## Phase 2 — Platform admin console (My Care Academy staff)

```
Read SPEC.md. Build the platform_admin console (only accessible to platform_admin):
- Organisations list: name, package tier, staff count, feature flags, status.
- Invite / edit / suspend an organisation; toggle forms_enabled and
  recruitment_enabled; set package tier.
- Cross-org analytics dashboard: total enrolments, completions, most-used courses,
  and per-org engagement (good vs poor). Use Recharts.
- Ability to add other platform_admin staff members.
Everything must be gated so only platform_admin can reach it.
```

## Phase 3 — Organisation admin console

```
Read SPEC.md. Build the org_admin console (scoped to their organisation only):
- Staff list with add / invite / deactivate, and bulk CSV import of staff.
- Assign courses or pathways to staff, with optional due dates.
- Engagement dashboard for their org: who has completed what, who's overdue, time
  spent, and a red/amber/green compliance view per staff member.
- Download / export reports as CSV and PDF.
Enforce that an org_admin can never see another organisation's data (rely on RLS +
UI scoping).
```

## Phase 4 — Course structure & the learner course player

```
Read SPEC.md. Build:
1. topics and courses tables, plus pathways and pathway_courses (course bundles).
   Seed the topics and 26 courses from section 4 of my build guide. Each course has
   an expiry_months field that admins can set and amend at any time (0 = never
   expires); this drives certificate expiry and re-training.
2. A learner dashboard: assigned courses, in-progress (resume where left off),
   completed, expired/required-again, and certificates. Show a progress bar per
   course.
3. A course player that renders mixed content: slide-style pages AND custom
   interactive activities. Build a small set of reusable React interaction
   components (drag-and-drop, fill-the-missing-word, image hotspot, MCQ slide)
   behind ONE pluggable content interface, so a course's content is described as
   structured data (JSON) rather than embedded H5P packages. Track progress and
   time_spent. Learners CAN leave a course part-way through and resume the content
   later from where they stopped. (The end-of-course assessment is handled in
   Phase 5 and is deliberately NOT resumable.)
Define the content-block JSON schema for a course and explain how I author content
(add/reorder blocks) and attach it to a course.
```

## Phase 5 — Quizzes & certificates

```
Read SPEC.md. Build the assessment + certificate system:
1. quiz_questions table (a bank of up to 50 multiple-choice questions per course).
2. On finishing a course, generate a quiz of 20 questions chosen at random from
   that course's bank. Store each attempt as its own quiz_attempts row with
   started_at and submitted_at.
3. The assessment is NOT resumable. Once a learner starts the quiz they must finish
   it in that sitting — no leaving and coming back to a part-done quiz. (Course
   content is resumable; the quiz is not.)
4. Pass mark 80%. On fail, allow unlimited retakes. Increment attempt_count on
   every attempt and completion_count on every pass. Learners may also voluntarily
   re-take a course they've already passed as many times as they like — count these
   too. Surface "times attempted" and "times completed" per learner per course to
   admins.
5. Certificates: generate a branded PDF with @react-pdf/renderer (learner name,
   course, date, unique ID), store it in Supabase Storage, and let the learner
   download it. Set expires_at
   from the course's expiry_months, measured from the completion date. EVERY pass
   issues a fresh certificate with a new expiry — including a voluntary early
   re-take of a course that hasn't expired yet, which renews the learner from the
   new completion date (their newest certificate is the live one). A learner can
   hold several certificates for the same course over time; always treat the most
   recent pass as the source of truth for compliance status and expiry.
6. A public certificate verification page (enter the certificate ID to confirm it's
   real). It must expose ONLY non-PII: valid/invalid, course title, issue date and
   expiry date — never the learner's contact details. Serve it via a
   SECURITY DEFINER function or a dedicated read path, not by opening RLS.
Write tests for the pass/fail logic, the random-20 selection, and the attempt/
completion counters.
```

## Phase 6 — Automated reports, reminders & renewals

```
Read SPEC.md. Build the proactive engine (this is the product's differentiator):
1. A scheduled job (Supabase cron or Vercel cron) that emails each org_admin a
   weekly digest: completions this week, overdue learners, low-engagement staff.
2. Learner reminder emails for assigned-but-not-started and overdue courses.
3. A renewal engine: when a certificate is within 60/30/7 days of expires_at, flag
   it amber/red and notify the learner and their org_admin. When it actually
   expires, set that enrolment's status back to "expired" so the course shows as
   REQUIRED AGAIN on the learner's dashboard and they must re-do it (content + quiz).
4. A platform_admin alert when any org's overall engagement drops below a
   threshold, so your team can reach out.
Use Resend. Make the thresholds and schedules configurable.
```

## Phase 7 — Forms feature (paid, conditional logic)

```
Read SPEC.md. Build the Forms add-on, only visible when the org's forms_enabled is
true:
1. A form builder with field types (text, number, date, select, radio, checkbox,
   file upload, signature) and CONDITIONAL LOGIC (show/hide or require a field
   based on another field's answer) — similar to Jotform.
2. A library of pre-made templates (application form, care assessment, client QA
   form) that an org can clone and edit.
3. Assign a form to staff or candidates; collect and store submissions; export to
   CSV/PDF; notify on submission.
Store conditional logic as JSON on each field. Enforce feature-gating via RLS and
UI.
```

## Phase 8 — Recruitment tracker (paid)

```
Read SPEC.md. Build the Recruitment add-on, only visible when recruitment_enabled
is true. Model it on an applicant tracking table:
- candidates table (name, gender, driver, postcode, entry date, contact details)
  scoped to the org.
- A wide table view with a document column per required item (Application Form,
  Proof of ID, Proof of NI, Address, References, Literacy Test, Interview, DBS,
  Role Acceptance, Contract, Training) — each cell shows uploaded / missing and
  links to the document.
- Candidate stages, a Hired/Rejected/Candidate status, search, "Download ZIP" of
  all a candidate's documents, and delete.
- Document-expiry tracking for DBS and right-to-work.
- When a candidate is marked Hired, offer to create them as a learner and
  auto-enrol them in the induction pathway.
```

## Phase 9 — Billing, packages & feature-gating

```
Read SPEC.md. Add Stripe:
1. Define package tiers (e.g. Core, Core+Forms, Core+Recruitment, Full). Map each
   tier to feature flags on the organisation.
2. Stripe Checkout + Customer Portal for organisations to subscribe/upgrade.
3. Webhooks that flip forms_enabled / recruitment_enabled when a subscription
   changes.
4. A billing view in both the platform_admin console (see all subscriptions) and
   the org_admin console (their own plan).
Never let a feature render if the org's plan doesn't include it — check on the
server, not just the UI.
```

## Phase 10 — Security hardening & go-live checklist

```
Read SPEC.md. Do a security and launch pass:
- Audit all RLS policies; write tests that attempt cross-org access and must fail.
- Enforce MFA for all admins; add rate limiting on auth endpoints.
- Add audit_logs recording sensitive actions (who did what, when).
- GDPR: data-retention settings, a data-export and account-deletion flow, cookie
  consent, and a privacy policy page.
- Confirm encryption at rest and in transit, and that Supabase is on UK/EU data
  residency.
- Produce a go-live checklist and a short runbook (backups, restoring, rotating
  secrets).
```

---

## 5. What to do after launch

- **Author the course content** using the platform's own content-block editor (or hire an instructional designer) — the platform is the vehicle; the 26 courses' actual slides, interactions and 50-question banks are content work separate from the build.
- **Pilot with one or two friendly organisations** before selling widely; the reports engine is your proof of value.
- **Position on compliance**, not just training: "CQC-ready records, and we tell you who's falling behind before your inspector does."

---

*Work through the phases in order. Commit after each. Test as you go.*
