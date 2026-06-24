import Link from "next/link";
import { Check, Sparkles, ArrowRight } from "lucide-react";

import { PLANS, planPrice } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/marketing/Reveal";
import { SectionHeading } from "@/components/marketing/SectionHeading";
import { cn } from "@/lib/utils";

export const metadata = { title: "Pricing" };

const INCLUDED = [
  "All core modules",
  "AI estimating & invoicing",
  "UK & DE VAT built in",
  "Unlimited customers & jobs",
  "Technician PWA",
  "Free updates",
];

const FAQ = [
  {
    q: "Do I need a credit card to start?",
    a: "No. The 14-day free trial needs no card — you only add billing details when you decide to continue.",
  },
  {
    q: "Can I change plans later?",
    a: "Yes, upgrade or downgrade any time from Settings → Billing. Changes are prorated automatically.",
  },
  {
    q: "How does the payment processing fee work?",
    a: "When a customer pays an invoice through the platform we take a 0.5% fee. Bank transfers and cash you mark as paid manually are never charged a fee.",
  },
  {
    q: "Which countries do you support?",
    a: "FieldOS AI launches in the UK and Germany with GBP/EUR billing and UK/DE VAT rules built in.",
  },
];

export default function PricingPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(40rem 28rem at 50% -30%, hsl(var(--primary) / 0.12), transparent 60%)",
          }}
        />
        <div className="relative mx-auto max-w-3xl px-4 py-20 text-center sm:py-24">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Simple, scalable pricing
          </p>
          <h1 className="text-balance font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Pricing that grows with your team
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
            Start free, no credit card required. Prices shown in GBP — German
            customers are billed in EUR.
          </p>
        </div>
      </section>

      {/* Plans */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid items-stretch gap-5 lg:grid-cols-4">
          {PLANS.map((plan, i) => {
            const isPro = plan.recommended;
            return (
              <Reveal key={plan.id} delay={i * 80} className="flex">
                <div
                  className={cn(
                    "relative flex w-full flex-col rounded-2xl border bg-card p-6 shadow-card transition-all duration-150 hover:-translate-y-0.5 hover:shadow-card-hover",
                    isPro && "border-primary/40 ring-2 ring-primary shadow-card-hover"
                  )}
                >
                  {isPro && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-sm">
                      Most popular
                    </span>
                  )}
                  <h2 className="font-display text-lg font-bold">{plan.name}</h2>
                  <p className="mt-3 flex items-baseline gap-1">
                    <span className="font-display text-4xl font-bold tracking-tight">
                      {planPrice(plan, "UK")}
                    </span>
                    {plan.priceGBP !== null && (
                      <span className="text-sm font-normal text-muted-foreground">
                        /mo
                      </span>
                    )}
                  </p>
                  <p className="text-xs font-medium text-primary">{plan.users}</p>
                  <p className="mt-3 text-sm text-muted-foreground">{plan.tagline}</p>
                  <ul className="mt-5 flex-1 space-y-2.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex gap-2 text-sm">
                        <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-success/15 text-success">
                          <Check className="h-3 w-3" />
                        </span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    asChild
                    className="mt-6"
                    variant={isPro ? "default" : "outline"}
                  >
                    <Link
                      href={
                        plan.id === "enterprise"
                          ? "/about"
                          : `/register?plan=${plan.id}`
                      }
                    >
                      {plan.id === "enterprise" ? "Contact sales" : "Start free trial"}
                    </Link>
                  </Button>
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* Included strip */}
        <Reveal delay={120} className="mt-10">
          <div className="rounded-2xl border bg-muted/30 p-6">
            <p className="text-center text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Every plan includes
            </p>
            <ul className="mx-auto mt-4 flex max-w-3xl flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
              {INCLUDED.map((item) => (
                <li key={item} className="inline-flex items-center gap-2">
                  <Check className="h-4 w-4 text-success" /> {item}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-2xl px-4 pb-20">
        <SectionHeading eyebrow="FAQ" title="Questions, answered" />
        <div className="mt-8 space-y-3">
          {FAQ.map(({ q, a }) => (
            <details
              key={q}
              className="group rounded-xl border bg-card p-4 shadow-card"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
                {q}
                <span className="ml-3 text-muted-foreground transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-2 text-sm text-muted-foreground">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-[#15181B] px-6 py-14 text-center text-white">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage:
                  "radial-gradient(34rem 22rem at 0% 120%, rgba(255,90,31,0.35), transparent 55%)",
              }}
            />
            <div className="relative">
              <h2 className="text-balance font-display text-3xl font-bold tracking-tight">
                Try it free for 14 days
              </h2>
              <p className="mx-auto mt-3 max-w-md text-white/70">
                No credit card. Set up your business in minutes.
              </p>
              <Button asChild size="xl" className="mt-7">
                <Link href="/register">
                  Start your free trial <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
