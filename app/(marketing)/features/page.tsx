import Link from "next/link";
import {
  PhoneCall,
  Camera,
  Target,
  MessageSquare,
  CalendarClock,
  Route,
  Smartphone,
  Boxes,
  CreditCard,
  LineChart,
  Sparkles,
  Star,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/marketing/Reveal";
import { SectionHeading } from "@/components/marketing/SectionHeading";
import { chipColor } from "@/components/marketing/chipColors";

export const metadata = { title: "Features" };

type Feature = { icon: LucideIcon; title: string; body: string };
type Group = { label: string; blurb: string; features: Feature[] };

const GROUPS: Group[] = [
  {
    label: "Win more work",
    blurb: "Capture every enquiry and turn it into a priced, accepted quote.",
    features: [
      {
        icon: PhoneCall,
        title: "AI phone receptionist",
        body: "Answers calls 24/7, captures the job, and books it — even when you're under a sink.",
      },
      {
        icon: Camera,
        title: "Photo-to-quote estimating",
        body: "Speak, type or photograph a job and get a priced, on-brand quote anchored to your own pricing.",
      },
      {
        icon: Target,
        title: "Win-probability scoring",
        body: "Every estimate predicts whether you'll win it — so you know where to follow up.",
      },
      {
        icon: MessageSquare,
        title: "Omni-channel capture",
        body: "Leads from your website widget, WhatsApp and SMS all land in one scored inbox.",
      },
    ],
  },
  {
    label: "Run the day",
    blurb: "Get the right person to the right job with the least driving.",
    features: [
      {
        icon: CalendarClock,
        title: "A dispatch board that thinks",
        body: "Per-technician lanes, live updates, and one-tap emergency reshuffles.",
      },
      {
        icon: Route,
        title: "Auto-schedule & route optimisation",
        body: "Assign the best technician and order the day's stops with live travel times.",
      },
      {
        icon: Smartphone,
        title: "Technician PWA",
        body: "A one-handed field app: navigate, photograph, voice-report and capture a signature — offline-ready.",
      },
      {
        icon: Boxes,
        title: "Materials, organised",
        body: "Track stock, forecast what you'll run out of, and draft supplier requests automatically.",
      },
    ],
  },
  {
    label: "Get paid & grow",
    blurb: "Turn finished work into cash, reviews and repeat business.",
    features: [
      {
        icon: CreditCard,
        title: "Invoicing & instant payments",
        body: "One-tap invoices, online card payments, and automatic overdue chasing.",
      },
      {
        icon: LineChart,
        title: "Profit on every job",
        body: "Real margin per job, technician, service and customer — the moment money lands.",
      },
      {
        icon: Sparkles,
        title: "AI Business Coach & CFO",
        body: "Ask why win rate dropped or who's most profitable — answered from your real numbers.",
      },
      {
        icon: Star,
        title: "Reviews & renewals",
        body: "Automatic review requests and reminders for recurring maintenance work.",
      },
    ],
  },
];

export default function FeaturesPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(40rem 28rem at 80% -20%, hsl(var(--primary) / 0.12), transparent 60%)",
          }}
        />
        <div className="relative mx-auto max-w-3xl px-4 py-20 text-center sm:py-24">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Every tool, one platform
          </p>
          <h1 className="text-balance font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Everything your service company needs — with AI through all of it
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
            From the first missed call to the final profit number, FieldOS runs
            the connective tissue of your business so you can stay on the tools.
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
        </div>
      </section>

      {/* Feature groups */}
      <div className="mx-auto max-w-6xl space-y-20 px-4 py-20">
        {GROUPS.map((group, gi) => (
          <section key={group.label}>
            <SectionHeading eyebrow={group.label} title={group.blurb} />
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {group.features.map((f, i) => {
                const Icon = f.icon;
                return (
                  <Reveal key={f.title} delay={i * 70}>
                    <div className="group h-full rounded-2xl border bg-card p-6 shadow-card transition-all duration-150 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-card-hover">
                      <span
                        className={`mb-4 grid h-11 w-11 place-items-center rounded-xl ${chipColor(
                          gi * 4 + i
                        )}`}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <h3 className="font-semibold">{f.title}</h3>
                      <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-[#15181B] px-6 py-14 text-center text-white">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage:
                  "radial-gradient(34rem 22rem at 100% -20%, rgba(255,90,31,0.4), transparent 55%)",
              }}
            />
            <div className="relative">
              <h2 className="text-balance font-display text-3xl font-bold tracking-tight">
                See it running your business
              </h2>
              <p className="mx-auto mt-3 max-w-md text-white/70">
                14-day free trial. No credit card. Cancel anytime.
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
