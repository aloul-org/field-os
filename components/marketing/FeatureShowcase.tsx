import {
  PhoneCall,
  Camera,
  Route,
  LineChart,
  Sparkles,
  Smartphone,
  Boxes,
  Star,
  Check,
  CheckCircle2,
  Image as ImageIcon,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { RouteLine } from "@/components/shared/RouteLine";
import { AreaChart } from "@/components/charts/AreaChart";
import { MiniBars } from "@/components/charts/MiniBars";
import { Reveal } from "@/components/marketing/Reveal";
import { SectionHeading } from "@/components/marketing/SectionHeading";
import { chipColor } from "@/components/marketing/chipColors";

const TREND = [
  { label: "Jan", value: 8200 },
  { label: "Feb", value: 9100 },
  { label: "Mar", value: 8700 },
  { label: "Apr", value: 11200 },
  { label: "May", value: 12600 },
  { label: "Jun", value: 14800 },
];

/** A faux app window used to "screenshot" a feature. */
function MockFrame({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-card-hover">
      <div className="flex items-center gap-1.5 border-b px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-destructive/50" />
        <span className="h-2.5 w-2.5 rounded-full bg-warning/50" />
        <span className="h-2.5 w-2.5 rounded-full bg-success/50" />
        <span className="ml-3 font-mono text-[11px] text-muted-foreground">{title}</span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function Row({
  index,
  icon: Icon,
  eyebrow,
  title,
  body,
  bullets,
  visual,
}: {
  index: number;
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  body: string;
  bullets: string[];
  visual: React.ReactNode;
}) {
  const reverse = index % 2 === 1;
  return (
    <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
      <Reveal from={reverse ? "right" : "left"} className={cn(reverse && "lg:order-2")}>
        <span
          className={cn(
            "inline-grid h-11 w-11 place-items-center rounded-xl",
            chipColor(index)
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
        <p className="mt-4 text-sm font-semibold uppercase tracking-wider text-primary">
          {eyebrow}
        </p>
        <h3 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">
          {title}
        </h3>
        <p className="mt-3 text-muted-foreground">{body}</p>
        <ul className="mt-5 space-y-2.5">
          {bullets.map((b) => (
            <li key={b} className="flex gap-2.5 text-sm">
              <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-success/15 text-success">
                <Check className="h-3 w-3" />
              </span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </Reveal>
      <Reveal
        from={reverse ? "left" : "right"}
        delay={120}
        className={cn(reverse && "lg:order-1")}
      >
        {visual}
      </Reveal>
    </div>
  );
}

const MORE = [
  { icon: Smartphone, title: "Technician PWA", body: "A one-handed field app — checklists, photos, voice reports and signatures, offline-ready." },
  { icon: Boxes, title: "Materials & stock", body: "Track parts, forecast shortfalls, and draft supplier orders without a spreadsheet." },
  { icon: Star, title: "Reviews & renewals", body: "Automatic review requests and reminders for recurring maintenance work." },
];

export function FeatureShowcase() {
  return (
    <section className="border-y bg-muted/20">
      <div className="mx-auto max-w-6xl px-4 py-20">
        <SectionHeading
          eyebrow="A closer look"
          title="See exactly how FieldOS runs each part of the job"
          sub="Scroll through the day — from the first ring to the final profit number. Every screen below is the real product."
        />

        <div className="mt-16 space-y-20 lg:space-y-28">
          {/* 1 — AI receptionist */}
          <Row
            index={0}
            icon={PhoneCall}
            eyebrow="Never miss a job"
            title="An AI receptionist that books the work"
            body="It picks up every call — at 7pm, on a Saturday, while you're under a sink — asks the right questions, captures the details and books the job. The lead lands in your inbox already scored."
            bullets={[
              "Answers phone, WhatsApp and SMS 24/7",
              "Scores each lead hot, warm or cold",
              "Writes a tidy call summary automatically",
            ]}
            visual={
              <MockFrame title="app.fieldos.ai / calls">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#2563EB]/10 text-[#2563EB]">
                      <PhoneCall className="h-4 w-4" />
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Incoming call</p>
                      <p className="font-mono text-[11px] text-muted-foreground">+44 7700 900421</p>
                    </div>
                    <span className="flex items-center gap-1 text-xs text-success">
                      <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> Live
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="max-w-[82%] rounded-2xl rounded-tl-sm bg-muted px-3 py-2 text-xs">
                      Thanks for calling Apex Plumbing — what&apos;s the issue?
                    </div>
                    <div className="ml-auto max-w-[82%] rounded-2xl rounded-tr-sm bg-primary/10 px-3 py-2 text-xs">
                      Boiler&apos;s leaking under the kitchen sink.
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border bg-success/5 p-2.5">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                    <span className="text-xs font-medium">Lead booked · Tomorrow 9:00</span>
                    <Badge variant="destructive" className="ml-auto">HOT</Badge>
                  </div>
                </div>
              </MockFrame>
            }
          />

          {/* 2 — Photo to quote */}
          <Row
            index={1}
            icon={Camera}
            eyebrow="Quote in minutes"
            title="Turn a photo into a priced quote"
            body="Snap the job, speak it, or type a few words. FieldOS drafts itemised lines and a price anchored to your own history — then tells you how likely you are to win it. You review and send."
            bullets={[
              "Reads photos to scope the work",
              "Prices from your real rates and past jobs",
              "Predicts win probability on every quote",
            ]}
            visual={
              <MockFrame title="app.fieldos.ai / estimates / new">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-16 w-16 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                      <ImageIcon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 text-xs text-primary">
                        <Sparkles className="h-3.5 w-3.5" /> Reading photo…
                      </div>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div className="h-full w-3/4 rounded-full bg-primary" />
                      </div>
                    </div>
                  </div>
                  <ul className="divide-y rounded-lg border text-xs">
                    {[
                      ["Replace flexi tap connector", "£28"],
                      ["Labour · 1.5 hrs", "£90"],
                      ["Call-out", "£45"],
                    ].map(([d, p]) => (
                      <li key={d} className="flex justify-between px-3 py-2">
                        <span>{d}</span>
                        <span className="font-mono">{p}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Total inc. VAT</span>
                    <span className="font-display text-lg font-bold">£196</span>
                  </div>
                  <Badge variant="success">Win probability 82%</Badge>
                </div>
              </MockFrame>
            }
          />

          {/* 3 — Scheduling & routing */}
          <Row
            index={2}
            icon={Route}
            eyebrow="Run the day"
            title="Dispatch the right tech, the smart way"
            body="Place jobs on your team's day, let the AI pick the best technician by skills and travel time, and optimise the driving route. Fit an emergency in with one tap — it proposes the safest swap."
            bullets={[
              "Per-technician lanes, updated live",
              "AI route optimisation with travel times",
              "One-tap emergency reshuffle",
            ]}
            visual={
              <MockFrame title="app.fieldos.ai / schedule">
                <div className="space-y-3">
                  {[
                    { name: "Mike", stops: "3 stops" },
                    { name: "Dana", stops: "2 stops" },
                  ].map((lane) => (
                    <div key={lane.name} className="rounded-lg border p-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">{lane.name}</span>
                        <span className="text-[10px] text-muted-foreground">{lane.stops}</span>
                      </div>
                      <div className="mt-2 flex gap-1.5">
                        <span className="h-5 flex-1 rounded bg-primary/20" />
                        <span className="h-5 flex-1 rounded bg-[#2563EB]/20" />
                        <span className="h-5 flex-1 rounded bg-success/20" />
                      </div>
                    </div>
                  ))}
                  <RouteLine className="px-1" />
                  <div className="flex items-center gap-2 rounded-lg border bg-primary/5 p-2.5 text-xs">
                    <Route className="h-4 w-4 shrink-0 text-primary" />
                    Route optimised · <span className="font-medium">14 min saved</span>
                  </div>
                </div>
              </MockFrame>
            }
          />

          {/* 4 — Get paid + profit */}
          <Row
            index={3}
            icon={LineChart}
            eyebrow="Get paid & know your numbers"
            title="From invoice to real profit, instantly"
            body="Raise an invoice from a finished job, send a payment link, and get paid by card. The moment money lands, FieldOS works out the real margin — labour, materials and overhead included."
            bullets={[
              "One-tap invoices and card payments",
              "Profit per job, technician and service",
              "A six-month revenue trend at a glance",
            ]}
            visual={
              <MockFrame title="app.fieldos.ai / finance">
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { k: "Revenue", v: "£14,800", t: "text-success" },
                      { k: "Profit", v: "£4,120", t: "text-foreground" },
                      { k: "Margin", v: "28%", t: "text-primary" },
                    ].map((s) => (
                      <div key={s.k} className="rounded-lg border bg-background/60 p-2.5">
                        <p className="text-[9px] uppercase tracking-wide text-muted-foreground">{s.k}</p>
                        <p className={cn("font-display text-base font-bold", s.t)}>{s.v}</p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-lg border bg-background/60 p-2">
                    <AreaChart data={TREND} />
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border bg-success/5 p-2.5 text-xs">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                    Invoice #1042 paid
                    <span className="ml-auto font-medium text-success">+£480</span>
                  </div>
                </div>
              </MockFrame>
            }
          />

          {/* 5 — AI Coach */}
          <Row
            index={4}
            icon={Sparkles}
            eyebrow="Your AI advisor"
            title="Ask your business anything"
            body="The AI Business Coach answers plain-English questions from your own data — why win rate moved, who's most profitable, where you're priced wrong — with the receipts, never guesswork."
            bullets={[
              "Answers from your real numbers",
              "Smart nudges when something needs you",
              "An AI CFO mode for the money questions",
            ]}
            visual={
              <MockFrame title="app.fieldos.ai / coach">
                <div className="space-y-3">
                  <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-primary/10 px-3 py-2 text-xs">
                    Why did our win rate drop last month?
                  </div>
                  <div className="max-w-[92%] rounded-2xl rounded-tl-sm bg-muted px-3 py-2 text-xs">
                    Win rate fell from 71% to 58%. Most losses were quotes over £2k — your pricing there is ~12% above the jobs you won.
                    <div className="mt-2.5 rounded-lg bg-background/70 p-2">
                      <MiniBars
                        rows={[
                          { label: "Won", value: 58, color: "hsl(var(--success))" },
                          { label: "Lost", value: 42, color: "hsl(var(--destructive))" },
                        ]}
                      />
                    </div>
                  </div>
                </div>
              </MockFrame>
            }
          />
        </div>

        {/* And more */}
        <div className="mt-20">
          <SectionHeading eyebrow="And there's more" title="Everything else in the box" />
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {MORE.map((m, i) => {
              const Icon = m.icon;
              return (
                <Reveal key={m.title} delay={i * 90}>
                  <div className="h-full rounded-2xl border bg-card p-6 shadow-card transition-all duration-150 hover:-translate-y-0.5 hover:shadow-card-hover">
                    <span
                      className={cn(
                        "mb-4 grid h-11 w-11 place-items-center rounded-xl",
                        chipColor(i + 2)
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="font-semibold">{m.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{m.body}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
