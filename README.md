# FieldOS AI

> Run your entire service company from one AI-powered platform.

An AI operating system for field service companies (plumbing, HVAC, electrical,
roofing, and more) for the UK and Germany. It answers the phone, books the job,
schedules the technician, writes the estimate and chases the invoice.

This repository is being built in phases (see `1.PLATFORM_PROMPT.md` for the full
spec). **Phase 1 (Foundation) is complete.**

## Tech stack

- **Next.js 14** (App Router) + TypeScript (strict)
- **Tailwind CSS v3** + **shadcn/ui** (New York)
- **Supabase** — Postgres, Row Level Security, Auth, Storage, Realtime
- **next-intl** (English + German, cookie-driven locale)
- **React Hook Form + Zod**, **Zustand**
- Claude API, OpenAI Whisper, Stripe, Twilio, Resend, Google Maps (wired in later phases)

## Getting started

```bash
# 1. Install
npm install

# 2. Configure environment
cp .env.example .env.local
#   then fill in your Supabase URL + keys (others can wait for later phases)

# 3. Apply the database schema
#   See supabase/README.md — run migrations in supabase/migrations in order.

# 4. (optional) Seed demo data
npm run seed            # creates demo@fieldos.ai / demo1234

# 5. Run
npm run dev             # http://localhost:3000
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run seed` | Seed the demo company + data |

## Architecture

Three UI surfaces, one design language:

- **Office App** (`app/(app)/...`) — owner / dispatcher / office staff. Desktop-first, responsive.
- **Technician App** (`app/(tech)/tech/...`) — field techs, mobile-first PWA *(later phase)*.
- **Customer surfaces** (`app/quote`, `app/invoice`, `app/(portal)`) — tokenised, no login *(later phase)*.

Key directories:

```
app/(marketing)   Public site (home, pricing, features, trades, about)
app/(auth)        Login, register, password reset, 6-step onboarding wizard
app/(app)         Authenticated office app (dashboard, customers, settings, …)
components/        UI primitives (components/ui) + feature components
lib/              env, supabase clients, auth (roles/session), validations, format, plans, trades
i18n/             next-intl config + locale cookie action
messages/         en.json, de.json
store/            Zustand stores
supabase/         SQL migrations + setup notes
scripts/          seed.ts
```

### Auth & access control

- Supabase Auth (email/password + Google OAuth). Session refreshed in `middleware.ts`.
- Two enforcement layers: **RLS** (data) + `requireSection()` / `canWrite()` helpers (UX).
- Roles: `owner`, `admin`, `dispatcher`, `estimator`, `technician`, `viewer`.
- Solo accounts hide Schedule/Team from the sidebar until a teammate is added.

## What's built (Phase 1)

- ✅ Full Supabase schema (all tables, RLS, helper functions, triggers, storage buckets)
- ✅ Auth (login / register / Google OAuth / password reset) + route protection
- ✅ 6-step onboarding wizard → creates company + owner + invited team members
- ✅ Office app shell (sidebar, mobile nav, top bar, role-based nav)
- ✅ Dashboard (live stats + "needs attention")
- ✅ CRM — customers (search incl. property address), detail with merged timeline,
  properties, rule-based upsell suggestions, lifetime value
- ✅ Company settings (business details, pricing, VAT, language)
- ✅ Marketing site (home, pricing, features, trades, about)
- ✅ i18n scaffolding (en/de) + region-aware currency/VAT
- ✅ Seed script

Modules for later phases (estimating, scheduling, invoicing, technician PWA, finance,
AI coach, etc.) have their data model, navigation and access control already in place,
with placeholder pages so every route is reachable.

## Notes & deliberate simplifications

- Insert/Update types are `Partial<Row>` (most columns are DB-defaulted); the real
  required-field enforcement is the Zod schema every write passes through.
- Locale follows the account (cookie), not the URL — the route tree matches the spec.
- See `supabase/README.md` for intentional deviations from the prompt's literal SQL.
