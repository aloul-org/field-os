import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";

import { TRADES, tradeBySlug } from "@/lib/trades";
import { Button } from "@/components/ui/button";

export function generateStaticParams() {
  return TRADES.filter((t) => t.value !== "other").map((t) => ({
    trade: t.slug,
  }));
}

export function generateMetadata({
  params,
}: {
  params: { trade: string };
}): Metadata {
  const trade = tradeBySlug(params.trade);
  return { title: trade ? `${trade.label} software` : "Trade" };
}

/** Trade-specific copy. Falls back to a generic line for any trade. */
const TRADE_COPY: Record<string, { headline: string; body: string }> = {
  plumbing: {
    headline: "Software built for plumbers",
    body: "From emergency boiler call-outs to bathroom installs — book the job, price the leak and chase the invoice without leaving the van.",
  },
  hvac: {
    headline: "Run your HVAC business on autopilot",
    body: "Route engineers between heating and cooling jobs, sell maintenance plans automatically, and quote complex installs from a photo.",
  },
  electrical: {
    headline: "Software built for electricians",
    body: "Capture jobs by voice, generate compliant estimates, and keep certificates and customers in one place.",
  },
  roofing: {
    headline: "Win more roofing jobs",
    body: "Quote from a photo of the roof, follow up automatically, and schedule crews around the weather.",
  },
};

export default function TradePage({ params }: { params: { trade: string } }) {
  const trade = tradeBySlug(params.trade);
  if (!trade || trade.value === "other") notFound();

  const copy = TRADE_COPY[trade.slug] ?? {
    headline: `Software built for ${trade.label.toLowerCase()} businesses`,
    body: "Answer the phone, quote the job, schedule the team and get paid — all from one AI-powered platform.",
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-24 text-center">
      <span className="mx-auto mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
        <trade.icon className="h-7 w-7" />
      </span>
      <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
        {copy.headline}
      </h1>
      <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
        {copy.body}
      </p>
      <Button asChild size="xl" className="mt-8">
        <Link href={`/register?trade=${trade.value}`}>
          Start free trial <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}
