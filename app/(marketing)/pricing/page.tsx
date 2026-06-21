import Link from "next/link";
import { Check } from "lucide-react";

import { PLANS, planPrice } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Pricing" };

const FAQ = [
  {
    q: "Do I need a credit card to start?",
    a: "No. The 14-day free trial on Starter or Growth needs no card — you only add billing details when you decide to continue.",
  },
  {
    q: "Can I change plans later?",
    a: "Yes, upgrade or downgrade at any time from Settings → Billing. Changes are prorated automatically.",
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
    <div className="mx-auto max-w-6xl px-4 py-16">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          Simple pricing that scales with your team
        </h1>
        <p className="mt-3 text-muted-foreground">
          Start free. No credit card required.
        </p>
      </div>

      <div className="mt-12 grid gap-5 lg:grid-cols-4">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`flex flex-col rounded-2xl border bg-card p-6 ${
              plan.recommended ? "ring-2 ring-primary" : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{plan.name}</h2>
              {plan.recommended && <Badge variant="success">Recommended</Badge>}
            </div>
            <p className="mt-3 text-3xl font-bold">
              {planPrice(plan, "UK")}
              {plan.priceGBP !== null && (
                <span className="text-sm font-normal text-muted-foreground">
                  /mo
                </span>
              )}
            </p>
            <p className="text-xs text-muted-foreground">{plan.users}</p>
            <p className="mt-3 text-sm text-muted-foreground">{plan.tagline}</p>
            <ul className="mt-5 flex-1 space-y-2">
              {plan.features.map((f) => (
                <li key={f} className="flex gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Button
              asChild
              className="mt-6"
              variant={plan.recommended ? "default" : "outline"}
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
        ))}
      </div>

      <div className="mx-auto mt-20 max-w-2xl">
        <h2 className="text-center text-2xl font-bold">
          Frequently asked questions
        </h2>
        <div className="mt-6 divide-y rounded-xl border">
          {FAQ.map(({ q, a }) => (
            <details key={q} className="group p-4">
              <summary className="cursor-pointer list-none font-medium">
                {q}
              </summary>
              <p className="mt-2 text-sm text-muted-foreground">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
