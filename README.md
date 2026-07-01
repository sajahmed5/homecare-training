# My Care Academy

A multi-tenant training platform (LMS) for the UK care sector, with paid Forms and Recruitment
add-ons. Compliance-first: CQC-ready records plus a proactive engine that flags who is falling
behind before an inspector does.

- **Product spec:** [`SPEC.md`](./SPEC.md) — read first.
- **Build plan:** [`my-care-academy-build-guide.md`](./my-care-academy-build-guide.md) — the
  phased prompt pack (Phases 0–10).

## Stack

Next.js (App Router) + TypeScript · Tailwind CSS v4 + shadcn/ui · Supabase (Postgres, Auth,
Storage) with Row-Level Security for tenant isolation · Stripe (billing/feature-gating) ·
`@react-pdf/renderer` (certificates) · Resend (email) · Vercel hosting.

> **Status: Phase 0 (skeleton).** No auth, schema, or features yet — those arrive in Phase 1+.

## Prerequisites

- Node.js 20+ (built with v24) and npm
- A Supabase project (this repo targets the **London / eu-west-2** project — UK data residency)

## Getting started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment**

   Copy the template and fill in the values from your Supabase project
   (Dashboard → Project Settings → API):

   ```bash
   cp .env.example .env.local
   ```

   `.env.local` is git-ignored — never commit secret values.

3. **Run the dev server**

   ```bash
   npm run dev
   ```

   Open <http://localhost:3000>.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |

## Environment variables

| Variable | Purpose | Secret? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | No |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key | No (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only admin key (bypasses RLS) | **Yes** |
| `STRIPE_SECRET_KEY` | Stripe API (Phase 9) | **Yes** |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing (Phase 9) | **Yes** |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe.js (Phase 9) | No |
| `RESEND_API_KEY` | Email (Phase 1b onward) | **Yes** |

## Project structure

```
app/                 App Router pages (landing page skeleton)
components/ui/        shadcn/ui components
lib/
  supabase/
    client.ts        Browser Supabase client
    server.ts        Server Supabase client (cookie-based)
  utils.ts           shadcn cn() helper
supabase/            Supabase CLI project (migrations live here in Phase 1+)
SPEC.md              Living product spec
```

## Database migrations

Schema is managed with the Supabase CLI (`npx supabase ...`) and lives under `supabase/`.
Migrations are the single source of truth — do not hand-edit schema in the dashboard without a
matching migration. (Introduced in Phase 1.)
