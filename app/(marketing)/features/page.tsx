import Link from "next/link";

import { Button } from "@/components/ui/button";

export const metadata = { title: "Features" };

const FEATURES = [
  ["Never miss a lead again", "An AI receptionist answers calls 24/7, captures the job and scores how hot it is — across phone, WhatsApp and your website."],
  ["Quote in seconds, not evenings", "Speak, type or photograph a job and get a priced, on-brand estimate, anchored to your own historical pricing."],
  ["Know which quotes you'll win", "Every estimate comes with a win-probability score so you know where to follow up — and where you're priced wrong."],
  ["A dispatch board that thinks", "Auto-assign the right technician and optimise routes with live traffic. Reshuffle the day around an emergency in one tap."],
  ["The job runs itself in the field", "Technicians get a one-handed app: navigate, photograph, record a voice report that writes itself, and capture a signature."],
  ["Get paid faster", "One-tap invoices from completed jobs, online card payments, and automatic overdue chasing."],
  ["See where the money goes", "Per-job, per-technician and per-service profitability — and an AI CFO that answers questions from your real numbers."],
  ["A coach in your pocket", "Ask the AI Business Coach why win rate dropped or who's most profitable. It answers from your data, with the receipts."],
  ["Keep customers for life", "Automatic review requests, renewal reminders for recurring work, and upsell suggestions on every customer."],
  ["Materials, organised", "Track stock, forecast what you'll run out of, and draft supplier requests without the spreadsheet."],
];

export default function FeaturesPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <h1 className="text-4xl font-bold tracking-tight">
        Everything your service company needs, in one place
      </h1>
      <div className="mt-12 grid gap-8 sm:grid-cols-2">
        {FEATURES.map(([title, body]) => (
          <div key={title}>
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{body}</p>
          </div>
        ))}
      </div>
      <div className="mt-16 text-center">
        <Button asChild size="xl">
          <Link href="/register">Start your free trial</Link>
        </Button>
      </div>
    </div>
  );
}
