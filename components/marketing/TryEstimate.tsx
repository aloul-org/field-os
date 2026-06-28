"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, Loader2, ArrowRight, Wand2, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

type Region = "UK" | "DE";

interface DemoLineItem {
  description: string;
  quantity: number;
  unit_price: number;
  kind?: string;
  line_total: number;
}

interface DemoResult {
  fallback: boolean;
  region: Region;
  job_title: string;
  summary_for_customer: string;
  line_items: DemoLineItem[];
  subtotal: number;
  vat_rate: number;
  vat_amount: number;
  total_inc_vat: number;
}

const EXAMPLES = [
  "Replace a leaking 15mm isolation valve under the kitchen sink, supply and fit.",
  "Install 6 double sockets and 4 downlights in a new home office.",
  "Annual service of a Worcester combi boiler, including flue check.",
  "Clear a blocked main drain and jet-wash the gully at a 3-bed semi.",
];

export function TryEstimate() {
  const [description, setDescription] = useState("");
  const [region, setRegion] = useState<Region>("UK");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DemoResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    if (description.trim().length < 3) {
      setError("Describe the job in a few words first.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/public/estimate-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: description.trim(), region }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Couldn't generate an estimate — please try again.");
        return;
      }
      setResult(json.data as DemoResult);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="border-y bg-muted/30">
      <div className="mx-auto max-w-5xl px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            Try it now — no signup
          </p>
          <h2 className="mt-2 text-balance font-display text-3xl font-bold tracking-tight">
            Describe a job. Get a priced quote in seconds.
          </h2>
          <p className="mt-3 text-muted-foreground">
            This is the real estimating engine — the heart of FieldOS. Type a job
            the way you&apos;d say it, and watch it become an itemised estimate.
          </p>
        </div>

        <div className="mx-auto mt-10 grid gap-6 lg:grid-cols-2">
          {/* Input */}
          <div className="rounded-2xl border bg-card p-5 shadow-card">
            <div className="mb-3 flex items-center justify-between gap-3">
              <label htmlFor="demo-desc" className="text-sm font-medium">
                Describe the job
              </label>
              <div className="inline-flex rounded-lg border bg-background p-0.5 text-xs">
                {(["UK", "DE"] as Region[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRegion(r)}
                    className={cn(
                      "rounded-md px-2.5 py-1 font-medium transition-colors",
                      region === r
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {r === "UK" ? "🇬🇧 UK" : "🇩🇪 DE"}
                  </button>
                ))}
              </div>
            </div>

            <Textarea
              id="demo-desc"
              rows={5}
              placeholder="e.g. Replace a leaking 15mm isolation valve under the kitchen sink, supply and fit, about an hour's labour."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <div className="mt-3 flex flex-wrap gap-1.5">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => setDescription(ex)}
                  className="rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  {ex.split(",")[0]}
                </button>
              ))}
            </div>

            {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

            <Button
              type="button"
              size="lg"
              className="mt-4 w-full"
              onClick={generate}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Working out the estimate…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Generate estimate
                </>
              )}
            </Button>
          </div>

          {/* Output */}
          <div className="rounded-2xl border bg-card p-5 shadow-card">
            {!result ? (
              <div className="flex h-full min-h-[16rem] flex-col items-center justify-center text-center text-muted-foreground">
                <span className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Wand2 className="h-6 w-6" />
                </span>
                <p className="max-w-xs text-sm">
                  Your itemised quote will appear here — line items, labour,
                  materials, VAT and the total.
                </p>
              </div>
            ) : (
              <div className="animate-slide-up-fade">
                <h3 className="font-display text-lg font-bold tracking-tight">
                  {result.job_title}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {result.summary_for_customer}
                </p>

                <ul className="mt-4 divide-y border-y text-sm">
                  {result.line_items.map((li, i) => (
                    <li key={i} className="flex items-center justify-between gap-3 py-2">
                      <span className="min-w-0">
                        <span className="block truncate">{li.description}</span>
                        <span className="text-xs text-muted-foreground">
                          {li.quantity} × {formatCurrency(li.unit_price, result.region)}
                        </span>
                      </span>
                      <span className="shrink-0 font-medium tabular-nums">
                        {formatCurrency(li.line_total, result.region)}
                      </span>
                    </li>
                  ))}
                </ul>

                <dl className="mt-3 space-y-1 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <dt>Subtotal</dt>
                    <dd className="tabular-nums">{formatCurrency(result.subtotal, result.region)}</dd>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <dt>VAT ({Math.round(result.vat_rate * 100)}%)</dt>
                    <dd className="tabular-nums">{formatCurrency(result.vat_amount, result.region)}</dd>
                  </div>
                  <div className="flex justify-between border-t pt-1.5 font-display text-base font-bold">
                    <dt>Total</dt>
                    <dd className="tabular-nums">{formatCurrency(result.total_inc_vat, result.region)}</dd>
                  </div>
                </dl>

                <div className="mt-5 rounded-xl border border-primary/20 bg-primary/5 p-4">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <Lock className="h-4 w-4 text-primary" />
                    {result.fallback
                      ? "Sample preview — sign up for real, AI-priced quotes"
                      : "Like it? Save, brand and send this quote in one tap."}
                  </p>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <Button asChild className="flex-1">
                      <Link href="/register">
                        Sign up to save &amp; send <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="flex-1">
                      <Link href="/login">I already have an account</Link>
                    </Button>
                  </div>
                </div>

                <p className="mt-3 text-center text-xs text-muted-foreground">
                  Illustrative only — the real app prices on your own rates and past quotes.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
