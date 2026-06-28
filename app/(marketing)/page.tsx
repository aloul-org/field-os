import Link from "next/link";
import {
  PhoneCall,
  Camera,
  Route,
  CreditCard,
  LineChart,
  Sparkles,
  ArrowRight,
  Check,
  Flame,
  CheckCircle2,
  Building2,
  HardHat,
  UserCheck,
  Clock,
  Banknote,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { RouteLine } from "@/components/shared/RouteLine";
import { AreaChart } from "@/components/charts/AreaChart";
import { Reveal } from "@/components/marketing/Reveal";
import { TryEstimate } from "@/components/marketing/TryEstimate";
import { FeatureShowcase } from "@/components/marketing/FeatureShowcase";
import { chipColor } from "@/components/marketing/chipColors";
import { cn } from "@/lib/utils";
import { TRADES } from "@/lib/trades";

const SAMPLE_TREND = [
  { label: "Jan", value: 8200 },
  { label: "Feb", value: 9100 },
  { label: "Mar", value: 8700 },
  { label: "Apr", value: 11200 },
  { label: "May", value: 12600 },
  { label: "Jun", value: 14800 },
];

const LOOP = [
  { icon: PhoneCall, label: "Capture the lead" },
  { icon: Camera, label: "Win the quote" },
  { icon: Route, label: "Schedule & dispatch" },
  { icon: HardHat, label: "Do the job" },
  { icon: CreditCard, label: "Get paid" },
  { icon: LineChart, label: "See the profit" },
];

const SURFACES = [
  {
    icon: Building2,
    title: "Office app",
    body: "The command centre — leads, scheduling, quotes, invoices, finance and the AI coach.",
  },
  {
    icon: HardHat,
    title: "Technician PWA",
    body: "Built for the van: dark, big buttons, offline-ready, installs to the home screen.",
  },
  {
    icon: UserCheck,
    title: "Customer pages",
    body: "Clean, no-login pages to accept a quote or pay an invoice in one tap.",
  },
];

const CAPABILITIES = [
  { icon: Clock, title: "24/7", body: "AI answers every call" },
  { icon: Camera, title: "Minutes", body: "from photo to quote" },
  { icon: Banknote, title: "One tap", body: "to get paid" },
  { icon: ShieldCheck, title: "UK & DE", body: "VAT built in" },
];

export default function HomePage() {
  return (
    <>
      {/* ───────────────── Hero ───────────────── */}
      <section className="relative overflow-hidden border-b">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(42rem 32rem at 85% -10%, hsl(var(--primary) / 0.14), transparent 60%), radial-gradient(32rem 28rem at -5% 110%, hsl(var(--primary) / 0.08), transparent 55%)",
          }}
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:py-24 lg:grid-cols-2">
          {/* Copy */}
          <div className="animate-slide-up-fade">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              The AI operating system for trade businesses
            </p>
            <h1 className="text-balance font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Run your whole service company on{" "}
              <span className="text-primary">autopilot</span>.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              FieldOS AI doesn&apos;t just digitise your paperwork — it runs the
              business. It answers the phone, books the job, schedules the
              technician, writes the estimate and chases the invoice.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="xl">
                <Link href="/register">
                  Start free trial <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="xl" variant="outline">
                <Link href="/features">Explore features</Link>
              </Button>
            </div>
            <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-success" /> 14-day free trial
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-success" /> No credit card
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-success" /> Cancel anytime
              </span>
            </p>
          </div>

          {/* Product mockup */}
          <div className="relative animate-scale-in">
            <div className="rounded-2xl border bg-card shadow-card-hover">
              {/* window chrome */}
              <div className="flex items-center gap-1.5 border-b px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
                <span className="ml-3 font-mono text-[11px] text-muted-foreground">
                  app.fieldos.ai / dashboard
                </span>
              </div>
              {/* body */}
              <div className="space-y-4 p-4">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { k: "Revenue", v: "£14,800", t: "text-success" },
                    { k: "Jobs today", v: "7", t: "text-foreground" },
                    { k: "Win rate", v: "68%", t: "text-primary" },
                  ].map((s) => (
                    <div key={s.k} className="rounded-lg border bg-background/60 p-3">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        {s.k}
                      </p>
                      <p className={`font-display text-lg font-bold ${s.t}`}>{s.v}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-lg border bg-background/60 p-3">
                  <p className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                    Revenue · last 6 months
                  </p>
                  <AreaChart data={SAMPLE_TREND} />
                </div>
                <RouteLine className="px-1" />
              </div>
            </div>

            {/* Floating accents */}
            <div className="absolute -left-4 top-16 hidden animate-float rounded-xl border bg-card p-3 shadow-card-hover sm:block">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-destructive/10 text-destructive">
                  <Flame className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs font-semibold">New hot lead</p>
                  <p className="text-[10px] text-muted-foreground">Boiler leak · booked</p>
                </div>
              </div>
            </div>
            <div
              className="absolute -right-4 bottom-10 hidden animate-float rounded-xl border bg-card p-3 shadow-card-hover sm:block"
              style={{ animationDelay: "1.2s" }}
            >
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-success/10 text-success">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs font-semibold">Quote accepted</p>
                  <p className="text-[10px] text-muted-foreground">+£480 · job created</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────── Capability band ───────────────── */}
      <section className="border-b bg-muted/30">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-10 md:grid-cols-4">
          {CAPABILITIES.map(({ icon: Icon, title, body }, i) => (
            <Reveal key={title} delay={i * 80}>
              <div className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-card">
                <span
                  className={cn(
                    "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
                    chipColor(i)
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-display text-lg font-bold leading-none">{title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{body}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ───────────────── Try the estimator (live demo) ───────────────── */}
      <TryEstimate />

      {/* ───────────────── The revenue loop ───────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            One connected loop
          </p>
          <h2 className="mt-2 text-balance font-display text-3xl font-bold tracking-tight">
            From the first call to the final profit — all in one place
          </h2>
          <p className="mt-3 text-muted-foreground">
            Every step feeds the next. No re-typing, no lost leads, no spreadsheet
            at midnight.
          </p>
        </Reveal>

        <Reveal delay={120} className="mt-12">
          <RouteLine className="mb-8 h-5" />
          <ol className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
            {LOOP.map(({ icon: Icon, label }, i) => (
              <li key={label} className="flex flex-col items-center text-center">
                <span className="relative grid h-14 w-14 place-items-center rounded-2xl border bg-card text-primary shadow-card">
                  <Icon className="h-6 w-6" />
                  <span className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-primary font-mono text-[10px] font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                </span>
                <p className="mt-3 text-sm font-medium">{label}</p>
              </li>
            ))}
          </ol>
        </Reveal>
      </section>

      {/* ───────────────── Feature showcase (scroll deep-dive) ───────────────── */}
      <FeatureShowcase />

      {/* ───────────────── Three surfaces ───────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            One brand, three surfaces
          </p>
          <h2 className="mt-2 text-balance font-display text-3xl font-bold tracking-tight">
            The right tool for the office, the van and the customer
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {SURFACES.map(({ icon: Icon, title, body }, i) => (
            <Reveal key={title} delay={i * 100}>
              <div className="h-full rounded-2xl border bg-card p-6 shadow-card transition-all duration-150 hover:-translate-y-0.5 hover:shadow-card-hover">
                <span
                  className={cn(
                    "mb-4 grid h-11 w-11 place-items-center rounded-xl",
                    chipColor(i + 1)
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ───────────────── Trades ───────────────── */}
      <section className="border-y bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <Reveal className="text-center">
            <p className="text-sm font-medium text-muted-foreground">
              Tuned for your trade
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              {TRADES.filter((t) => t.value !== "other").map((trade) => (
                <Link
                  key={trade.slug}
                  href={`/trades/${trade.slug}`}
                  className="flex items-center gap-2 rounded-full border bg-background px-4 py-2 text-sm transition-colors hover:border-primary/40 hover:text-primary"
                >
                  <trade.icon className="h-4 w-4 text-primary" />
                  {trade.label}
                </Link>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ───────────────── Final CTA ───────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-[#15181B] px-6 py-16 text-center text-white">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage:
                  "radial-gradient(36rem 24rem at 100% -20%, rgba(255,90,31,0.4), transparent 55%), radial-gradient(28rem 22rem at 0% 120%, rgba(255,90,31,0.25), transparent 55%)",
              }}
            />
            <div className="relative">
              <h2 className="mx-auto max-w-2xl text-balance font-display text-3xl font-bold tracking-tight sm:text-4xl">
                Stop running your business from a notebook and three apps.
              </h2>
              <ul className="mx-auto mt-6 flex max-w-xl flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-white/80">
                {["No setup fees", "Cancel anytime", "UK & DE VAT built in"].map(
                  (item) => (
                    <li key={item} className="inline-flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" /> {item}
                    </li>
                  )
                )}
              </ul>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button asChild size="xl">
                  <Link href="/register">
                    Start your free trial <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="xl"
                  variant="outline"
                  className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
                >
                  <Link href="/pricing">See pricing</Link>
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
