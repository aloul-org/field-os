# FieldOS Mobile

The Flutter app for FieldOS AI — one codebase for Android and iOS, sharing the
web app's Supabase backend and design tokens.

## The one thing to understand

**Mobile and web are two front-ends over the same database.** Both point at the
same Supabase project, so an account created on either works on the other with
no syncing to build. There is no separate mobile backend.

Traffic splits in two:

| What | Goes to | Why |
| --- | --- | --- |
| Auth + all CRUD (customers, estimates, jobs, invoices, leads, appointments…) | **Supabase directly** | RLS already scopes every row to the user's company — the same boundary the web app relies on. No API layer needed. |
| Anything AI (estimate extraction, Coach/CFO, copilot, voice reports, PDFs) | **Next.js API** with a Bearer token | These need server-held provider keys (Anthropic/OpenAI/Stripe). A key bundled in the app can be extracted from the APK/IPA, so it stays server-side. |

Next.js server *actions* are unreachable from Flutter — only route handlers
under `app/api/*` can be called.

### The Bearer shim

`getRouteContext(section, request)` in `lib/auth/session.ts` accepts
`Authorization: Bearer <supabase_jwt>` alongside its normal cookie flow. It
returns the Supabase client to use — **use that one**, don't call
`createClient()` again in a route that supports mobile: a bearer request carries
no cookies, so a cookie-bound client runs as anon and RLS silently returns
nothing.

To open another AI route to mobile:

```ts
const auth = await getRouteContext("estimates", request); // pass `request`
if ("error" in auth) return auth.error === "unauthorized" ? unauthorized() : forbidden();
const { ctx, supabase } = auth;                            // use this supabase
```

## Setup

```bash
cp .env.example .env    # fill in — mirror the web app's NEXT_PUBLIC_* values
flutter pub get
flutter run
```

`.env` holds **public values only** (Supabase URL + anon/publishable key, API
base URL). It's bundled into the app; never put a secret in it.

For the AI estimate flow you also need the Next.js app running (`npm run dev`)
and a real `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` in its `.env.local` —
extraction returns a 502 otherwise.

`API_BASE_URL` differs by target: Android emulator reaches the host at
`http://10.0.2.2:3000`, iOS simulator at `http://localhost:3000`.

## Layout

```
lib/
  theme/tokens.dart      Design tokens ported 1:1 from app/globals.css
  theme/app_theme.dart   ThemeData built from those tokens
  core/                  env, Supabase client, Bearer API client
  models/                team_role.dart (port of lib/auth/roles.ts), estimate.dart
  features/
    auth/                login + session (mirrors getActiveContext)
    home/                the estimate-first home screen
    estimates/           extraction service + draft result
    tech/                technician field surface (ink-900)
    shell/               role-aware nav drawer + placeholders
  router.dart            go_router; role landing decided in _HomeGate
```

## Conventions worth keeping

- **Money is never computed here.** Every total comes from `computeTotals` in
  `lib/money.ts` server-side. The LLM isn't trusted for arithmetic and neither
  is the client. Don't add math to `models/estimate.dart`.
- **Colours come from tokens, not literals.** `context.colors.primary`, never
  `Color(0xFFFF5A1F)`. Tokens are written as the same HSL triples the CSS uses
  so the two stay diffable — change them alongside `globals.css`.
- **`models/team_role.dart` mirrors `lib/auth/roles.ts`.** If role access changes
  there, change it here. It drives UX only; RLS is the real boundary, so drift
  is a cosmetic bug rather than a security hole.
- **The home screen stays one prompt.** Estimating is the headline feature;
  navigation lives behind the drawer deliberately.

## Version pins

- **Flutter 3.24.3** is what this was built against. `flutter analyze`, tests and
  `flutter build apk --debug` are green on it.
- **`app_links` is pinned `<6.4.0`.** 6.4+ reads `flutter.compileSdkVersion`
  inside its own Gradle library project, which the Flutter 3.24 Gradle plugin
  doesn't expose to plugin subprojects — the Android build fails to configure.
  Drop the pin after upgrading Flutter.
- **`compileSdk = 35`** is hardcoded in `android/app/build.gradle` because
  `flutter_plugin_android_lifecycle` needs it and Flutter 3.24 defaults to 34.

## Status

Working end to end: login, role-aware landing, the estimate prompt (text +
photos) → real AI extraction → priced draft, and the technician's today list
(live from Supabase).

Not built yet — every section routes and is role-gated, but shows a placeholder:
saving/sending an estimate, customers, leads, calls, schedule, jobs, materials,
invoices, finance, coach, reviews, dashboard, team, settings, and the deeper
technician screens (checklist, photo upload, voice report, signature).

Suggested order: finish the estimate loop first (save draft → pick customer →
send), since it's the headline feature and proves the CRUD-over-Supabase pattern
the rest of the screens will copy.
