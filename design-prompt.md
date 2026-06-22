# Design System Prompt — Shared Across TradeQuote AI and FieldOS AI
# Paste this into Claude Code. Use it two ways:
#   1. On the existing TradeQuote AI repo, as a restyle pass (see "Applying this to TradeQuote AI" below).
#   2. On the new FieldOS AI repo, as the design foundation built in from Phase 1 of that project's prompt.
# The token system, type system, and component patterns below are identical across
# both products so a contractor moving between them (or a future merge of the two)
# feels like one brand, not two different tools.

---

## The brief, restated

Modern. Trend-aware. Orange as the primary colour. Not the look every AI-generated SaaS app defaults to right now. Easy enough that a tradesperson on a job site, on their phone, in a hurry, never has to think about how to use it.

Before picking colours and fonts, it's worth being explicit about what to avoid, because there are a small number of looks that AI design tools converge on by default regardless of brief: (1) a warm cream background with a high-contrast serif headline and a soft terracotta accent, (2) a near-black background with one neon accent colour, (3) a broadsheet layout with hairline rules and zero border-radius everywhere. None of these are wrong in isolation, but landing on one of them by default — especially the first one, which orange can drift toward if you're not deliberate — would make this look like every other AI-built product launched this year. The direction below is built from the actual subject matter instead: work orders, job tickets, route maps, steel and site-safety materials. That's where "TradeQuote AI" and "FieldOS AI" should visually come from, not a generic SaaS template with an orange button swapped in.

---

## Design direction

**The world this product lives in:** paperwork a tradesperson actually uses — a written-out work order, a carbon-copy invoice pad, a route sheet clipped to a dashboard, a steel toolbox. The product digitises that world; the design should still feel like it belongs to it. That's where the signature elements below come from.

**Audience reality check that should override any trend that doesn't serve it:** the person using this is standing in a doorway, in poor light, with one free hand, and doesn't want to think about the interface at all. Every aesthetic decision below is filtered through that — bold and confident is good, decorative or fiddly is not.

---

## Token system

### Colour

```css
:root {
  /* Brand — Signal Orange. Reserved for primary actions, the brand mark, active
     states, and the one "this is the important thing" moment per screen. Never
     used as a large background fill or for status/warning colour (see Status below) —
     if everything is orange, the actual call-to-action stops standing out. */
  --color-orange-50:  #FFF4ED;
  --color-orange-100: #FFE3D1;
  --color-orange-300: #FFA873;
  --color-orange-500: #FF5A1F;  /* primary */
  --color-orange-600: #E8480F;  /* hover / active */
  --color-orange-700: #C13A0C;  /* pressed */

  /* Ink — cool graphite, not pure black. Primary text and the Technician App's
     dark mode base. */
  --color-ink-900: #15181B;
  --color-ink-700: #2B3034;
  --color-ink-500: #5B6770;     /* secondary text, icons */

  /* Paper — warm neutral, NOT the cliché cream (#F4F1EA). Slightly cooler and
     lighter so it doesn't drift toward the "terracotta-on-cream" default look. */
  --color-paper-50:  #FAF9F7;   /* main background */
  --color-paper-100: #F0EEEA;   /* card fill, subtle section breaks */
  --color-paper-200: #E2DFD9;   /* borders, dividers */

  /* Status — deliberately distinct hues from the brand orange so "warning" and
     "this is a button" never get confused on the same screen. */
  --color-success-600: #15803D;  /* paid, accepted, completed */
  --color-warning-600: #CA8A04;  /* due soon, needs review — yellow-amber, not orange */
  --color-danger-600:  #DC2626;  /* overdue, rejected, error */
}
```

### Typography

Three roles, deliberately not the same three fonts every SaaS product reaches for:

- **Display** (`font-display`): **Space Grotesk** — a geometric, slightly mechanical grotesk that reads as technical/confident without being cold. Used for page titles, hero headlines, and large numbers (quote totals, dashboard stats). Bold weight (700), tight letter-spacing (`-0.02em`), used with restraint — never for body copy.
- **Body** (`font-body`): **Inter** — kept from the existing TradeQuote AI stack deliberately (it's already embedded in the PDF template and proven legible at small sizes on a phone in bright light). Regular/medium weights only in UI; this is the workhorse face, not where personality lives.
- **Data/utility** (`font-mono`): **IBM Plex Mono** — used specifically for things that look like they came off a printed ticket: quote numbers (`Q-2026-0042`), invoice numbers, timestamps, job IDs, phone numbers in lists. This is a deliberate nod to the carbon-copy work-order aesthetic and doubles as a genuinely useful alignment tool for tabular data.

```js
// next/font setup
import { Space_Grotesk, Inter, IBM_Plex_Mono } from 'next/font/google'

const display = Space_Grotesk({ subsets: ['latin'], variable: '--font-display', weight: ['500','700'] })
const body = Inter({ subsets: ['latin'], variable: '--font-body', weight: ['400','500','600'] })
const mono = IBM_Plex_Mono({ subsets: ['latin'], variable: '--font-mono', weight: ['400','500'] })
```

### Spacing, radius, and shadow

- Spacing scale: stick to Tailwind's default 4px base scale — don't invent a custom one, the existing components already use it.
- Radius: `--radius-sm: 8px` (buttons, inputs), `--radius-md: 12px` (cards), `--radius-pill: 999px` (status badges only). Deliberately not 0 (avoids the broadsheet cliché) and not 20px+ everywhere (avoids the generic bubbly-SaaS look).
- Shadows: soft and warm-tinted, not the default cool grey/blue shadow most UI kits ship with — derive shadow colour from `--color-ink-900` at low opacity so cards feel like paper lifted slightly off a desk, not glass floating in space.
  ```css
  --shadow-card: 0 1px 2px rgba(21,24,27,0.04), 0 4px 12px rgba(21,24,27,0.06);
  --shadow-card-hover: 0 2px 4px rgba(21,24,27,0.06), 0 8px 20px rgba(21,24,27,0.10);
  ```

### Motion

Deliberate, not scattered. Three specific moments, nothing else animated by default:
1. **Dashboard load**: stat cards fade/rise in with an 80ms stagger — one orchestrated moment, not a separate animation on every element.
2. **Card hover** (job cards, lead cards, estimate cards): `translateY(-2px)` + shadow shift from `--shadow-card` to `--shadow-card-hover`, 150ms ease-out.
3. **Status change**: when a job/invoice/lead status badge changes (e.g. sent → accepted), the badge does a brief colour cross-fade rather than an abrupt swap, 200ms.
Respect `prefers-reduced-motion` everywhere — disable all three above when it's set, don't just slow them down.

---

## Signature element: the Job Ticket + Route Line

This is the one distinctive, memorable device — used with restraint, not on every surface.

**The Job Ticket**: the card component used for estimates, invoices, jobs, and leads gets a subtle torn/perforated top edge — a thin dashed border with small semicircular notches cut into the top corners via `box-shadow`/`mask` or layered pseudo-elements, evoking a carbon-copy work-order pad. Apply this treatment to the *primary* card type in each list view (the `EstimateCard`, `InvoiceCard`, `JobCard`, `LeadCard` components) — not to every panel or container on a page, or it stops being a signature and becomes wallpaper.

**The Route Line**: a thin connecting line — solid in the functional dispatch-board map (FieldOS), and echoed decoratively as a dotted SVG path linking sequential steps elsewhere (the onboarding progress indicator, a marketing-site "how it works" section, the job timeline on a customer's history view). Small circular "stop" markers sit at each connection point. This ties the brand's actual function — an AI that sequences your day — to a recurring visual idea, rather than being decoration for its own sake.

Use one or the other per surface, not both stacked on the same screen.

---

## Component patterns

- **Dashboard stat cards**: bento-style, not a uniform 4-equal-column grid — one larger "hero" stat (e.g. Revenue this month) with 2–3 smaller supporting stats arranged around it. Adds visual hierarchy without extra decoration.
- **Status badges**: pill-radius, coloured background at the `-100` tint of the relevant status colour with `-700` text, never the full-saturation colour as a fill (keeps long lists of badges calm rather than noisy).
- **Primary buttons**: `--color-orange-500` fill, white text, `--radius-sm`, `--color-orange-600` on hover, subtle `scale(0.98)` on press. There is exactly one primary-styled button visible per screen at a time — everything else is secondary (outlined, ink-coloured) or a text link.
- **Empty states**: a simple line-art illustration (not a stock photo, not a generic "empty box" icon) relevant to what's missing — e.g. a route line with no stops yet for an empty schedule — plus one sentence explaining what will appear there and, where relevant, one button to create the first item.
- **Forms**: labels above inputs (not floating labels — they hurt legibility for the target audience), generous tap targets (min 48px height on every interactive element across both products, not just the Technician App), inline validation that appears on blur, not on every keystroke.

---

## Dark mode (Technician App only, v1)

The Technician App (`/tech/*`) gets a dark mode built on `--color-ink-900` as the base, both because field technicians are often outdoors in bright glare where a light UI washes out, and because it's a meaningfully different context from the office. Keep `--color-orange-500` as the accent but verify contrast — at `#FF5A1F` on `#15181B` the contrast ratio is sufficient for large text/icons but borderline for small body text; use `--color-orange-300` for any small-text orange on dark backgrounds to stay WCAG AA compliant. The Office App and marketing site stay light-only in v1 — don't build a second dark theme for those without a specific reason to.

---

## Voice and content

Words are part of the design, not an afterthought layered on at the end. A few concrete rules, with before/after examples pulled from this exact product:

- Name things by what the person controls, not how the system works internally. "Send quote," not "Submit." "Your jobs today," not "Active appointment records."
- Active voice, and the vocabulary stays identical through a whole flow: if the button says "Send quote," the resulting toast says "Quote sent," not "Your submission was successful."
- Errors state what happened and what to do, without apologising or being vague: "Couldn't send — check the client's phone number and try again," not "Something went wrong."
- Empty states invite action: "Leads from calls, WhatsApp, and your website will show up here" rather than "No leads found."
- Loading states are specific, never a bare spinner: "Working out the best route...", "Looking at your photos...", "Thinking about your job..." — already established in TradeQuote AI's existing copy; carry that pattern into every new screen in both products.

---

## Applying this to FieldOS AI (new build — foundation, not a pass)

Bake this in at Phase 1, Step 1 of the FieldOS AI build prompt — `tailwind.config.ts`, `globals.css`, and font loading are part of initial project setup, before any feature work starts. Apply the three-surface adaptation already specified in that document on top of these shared tokens, not instead of them:
- **Office App**: full token system as described above, bento dashboards, Job Ticket cards.
- **Technician App**: same tokens, dark-mode variant, larger type scale and spacing (bump the base font size and tap targets up roughly 15–20% versus the Office App), Route Line motif used functionally on the live map.
- **Customer surfaces** (`/quote/[token]`, `/invoice/[token]`, `/portal/[customerToken]`): lightest-touch application — paper background, orange used only for the single primary button ("Accept this quote" / "Pay now"), no Job Ticket perforated edges or Route Line decoration here at all. These pages exist to get one clean decision out of someone who didn't ask to be using software; keep them calm.

---

## Self-critique checklist before calling any screen done

- [ ] Exactly one primary-orange element visible at a time on this screen — if there are two, demote one to secondary.
- [ ] Works at 375px width without horizontal scroll or cramped tap targets.
- [ ] Visible keyboard focus state on every interactive element.
- [ ] `prefers-reduced-motion` disables all three motion moments above.
- [ ] Loading and empty states use the specific, human-language copy pattern, not generic placeholders.
- [ ] Look at the screen and remove one thing — if nothing can be removed without losing meaning, it's done.
