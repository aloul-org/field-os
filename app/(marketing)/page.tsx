import Link from "next/link";
import {
  PhoneCall,
  FileText,
  CalendarClock,
  Bot,
  ArrowRight,
  Check,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { TRADES } from "@/lib/trades";

const MODULES = [
  {
    icon: PhoneCall,
    title: "It answers the phone",
    body: "An AI receptionist books the job, captures the details and scores the lead — even when you're under a sink.",
  },
  {
    icon: FileText,
    title: "It writes the estimate",
    body: "Speak, type or photograph the job. FieldOS drafts a priced, on-brand quote in seconds and predicts whether you'll win it.",
  },
  {
    icon: CalendarClock,
    title: "It schedules the day",
    body: "Auto-assign the right technician and optimise the route with live traffic — no whiteboard, no double-bookings.",
  },
  {
    icon: Bot,
    title: "It coaches the business",
    body: "Ask why profit was down last month. The AI Business Coach answers from your real numbers, not guesswork.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-accent/40 to-background">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:py-28">
          <p className="mb-4 inline-flex rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
            For plumbing, HVAC, electrical, roofing & more
          </p>
          <h1 className="mx-auto max-w-3xl text-balance text-4xl font-bold tracking-tight sm:text-5xl">
            Run your entire service company from one AI-powered platform.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            FieldOS AI doesn&apos;t just digitise your paperwork — it runs the
            business. It answers the phone, books the job, schedules the
            technician, writes the estimate and chases the invoice.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="xl">
              <Link href="/register">
                Start free trial <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="xl" variant="outline">
              <Link href="/pricing">See pricing</Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            14-day free trial · No credit card required
          </p>
        </div>
      </section>

      {/* Module showcase */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="grid gap-6 sm:grid-cols-2">
          {MODULES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl border bg-card p-6">
              <span className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trades strip */}
      <section className="border-y bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <p className="text-center text-sm font-medium text-muted-foreground">
            Built for your trade
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {TRADES.filter((t) => t.value !== "other").map((trade) => (
              <Link
                key={trade.slug}
                href={`/trades/${trade.slug}`}
                className="flex items-center gap-2 rounded-full border bg-background px-4 py-2 text-sm hover:border-primary/40"
              >
                <trade.icon className="h-4 w-4 text-primary" />
                {trade.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="rounded-3xl bg-primary px-6 py-14 text-center text-primary-foreground">
          <h2 className="text-balance text-3xl font-bold">
            Stop running your business from a notebook and three apps.
          </h2>
          <ul className="mx-auto mt-6 flex max-w-xl flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
            {["No setup fees", "Cancel anytime", "UK & DE VAT built in"].map(
              (item) => (
                <li key={item} className="inline-flex items-center gap-2">
                  <Check className="h-4 w-4" /> {item}
                </li>
              )
            )}
          </ul>
          <Button asChild size="xl" variant="secondary" className="mt-8">
            <Link href="/register">Start your free trial</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
