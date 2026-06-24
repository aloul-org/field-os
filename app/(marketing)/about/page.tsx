import Link from "next/link";
import {
  HardHat,
  ShieldCheck,
  Layers,
  Globe,
  ArrowRight,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { RouteLine } from "@/components/shared/RouteLine";
import { Reveal } from "@/components/marketing/Reveal";
import { SectionHeading } from "@/components/marketing/SectionHeading";
import { chipColor } from "@/components/marketing/chipColors";

export const metadata = { title: "About" };

type Principle = { icon: LucideIcon; title: string; body: string };

const PRINCIPLES: Principle[] = [
  {
    icon: HardHat,
    title: "Built for the trade",
    body: "Not a generic CRM with a trade skin. Every screen is made for a busy owner with one free hand on a job site.",
  },
  {
    icon: ShieldCheck,
    title: "AI you can trust with money",
    body: "The AI drafts and narrates; the maths is always computed in code. We never let a language model invent a number on an invoice.",
  },
  {
    icon: Layers,
    title: "One platform, not ten",
    body: "Calls, quotes, scheduling, invoicing, finance and retention in one connected loop — so nothing falls through the cracks.",
  },
  {
    icon: Globe,
    title: "Local-first: UK & DE",
    body: "VAT, billing currency and language done properly for each market from day one — English and German, GBP and EUR.",
  },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(40rem 28rem at 70% -20%, hsl(var(--primary) / 0.12), transparent 60%)",
          }}
        />
        <div className="relative mx-auto max-w-3xl px-4 py-20 text-center sm:py-24">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Our story
          </p>
          <h1 className="text-balance font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Why we built FieldOS AI
          </h1>
          <RouteLine className="mx-auto mt-6 max-w-xs" />
        </div>
      </section>

      {/* Story */}
      <section className="mx-auto max-w-2xl px-4 py-16">
        <Reveal className="space-y-5 text-lg leading-relaxed text-muted-foreground">
          <p>
            Field service software has spent twenty years digitising paperwork.
            The job sheet became a screen, the invoice became a PDF — but the
            owner still runs the business from their head, a notebook and three
            apps that don&apos;t talk to each other.
          </p>
          <p>
            We think the next decade is different. The same AI that can answer a
            phone, read a photo of a leaking boiler and write a professional
            quote can run the connective tissue of a service company — so a
            two-person plumbing firm can operate like one with a back office of
            ten.
          </p>
          <p className="font-medium text-foreground">
            FieldOS AI is built for the trades, in the UK and Germany first, with
            VAT, billing and language done properly for each market. One
            platform, an AI layer through every part of it.
          </p>
        </Reveal>
      </section>

      {/* Principles */}
      <section className="border-y bg-muted/20">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <SectionHeading
            eyebrow="What we believe"
            title="The principles behind the product"
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            {PRINCIPLES.map((p, i) => {
              const Icon = p.icon;
              return (
                <Reveal key={p.title} delay={(i % 2) * 90}>
                  <div className="flex h-full gap-4 rounded-2xl border bg-card p-6 shadow-card">
                    <span
                      className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${chipColor(
                        i
                      )}`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="font-semibold">{p.title}</h3>
                      <p className="mt-1.5 text-sm text-muted-foreground">{p.body}</p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-[#15181B] px-6 py-14 text-center text-white">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage:
                  "radial-gradient(34rem 22rem at 100% 120%, rgba(255,90,31,0.35), transparent 55%)",
              }}
            />
            <div className="relative">
              <h2 className="text-balance font-display text-3xl font-bold tracking-tight">
                Run your business the modern way
              </h2>
              <p className="mx-auto mt-3 max-w-md text-white/70">
                Join the trades putting their admin on autopilot.
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
