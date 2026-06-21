# Supabase setup

## 1. Create the project

Create a new Supabase project (UK/EU region recommended for GDPR), then copy the
project URL, `anon` key and `service_role` key into `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## 2. Apply migrations (in order)

The files in `migrations/` are numbered and **must be run in order** — helper
functions (`0001`) are referenced by every table's RLS policy.

**Option A — Supabase CLI (recommended):**

```bash
supabase link --project-ref <your-ref>
supabase db push
```

**Option B — SQL editor:** paste each `migrations/00XX_*.sql` file into the
Supabase SQL editor and run them in ascending numeric order.

## 3. Enable Google OAuth (optional)

Authentication → Providers → Google. Add the client ID/secret and set the
redirect URL to `<NEXT_PUBLIC_APP_URL>/auth/callback`.

## 4. Seed demo data

```bash
npm run seed
```

Creates `demo@fieldos.ai` / `demo1234` and the "Apex Heating & Plumbing" demo
company (see `scripts/seed.ts`).

## Deviations from the prompt's literal SQL (intentional, per narrative spec)

- `companies.company_size`, `companies.monthly_overhead`, `companies.voice_greeting`
  added — required by sidebar gating, Module 9 overhead allocation and Module 2
  Pro custom greeting respectively.
- `invoices.public_token` added — the spec routes `/invoice/[token]` but the
  literal table had no token column.
- `job_checklist_templates` table added — required by Module 4 templated checklists.
- Extra RLS policies for bootstrap inserts (owner creating their first company /
  owner team_members row) and tokenised public read RPCs.
