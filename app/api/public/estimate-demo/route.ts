import { z } from "zod";

import { ok, err, parseBody } from "@/lib/api/response";
import { checkRateLimit } from "@/lib/api/rateLimit";
import { extractEstimate } from "@/lib/ai/estimateEngine";
import { computeTotals } from "@/lib/money";
import { optionalServerEnv } from "@/lib/env";

// AI extraction can exceed the default serverless timeout; run on Node.
export const runtime = "nodejs";
export const maxDuration = 30;

const demoSchema = z.object({
  description: z.string().min(3).max(600),
  trade: z.string().max(40).optional(),
  region: z.enum(["UK", "DE"]).optional(),
});

// Sensible demo pricing so the AI has rates to work from (the real app uses the
// company's own configured rates). These are illustrative only.
const DEMO_HOURLY = { UK: 55, DE: 65 } as const;
const DEMO_VAT = { UK: 0.2, DE: 0.19 } as const;

/**
 * Public, unauthenticated "try an estimate" endpoint for the marketing page.
 * Runs the real estimate engine on the visitor's text, rate-limited per IP, with
 * a canned fallback so the landing page never looks broken if the AI key is
 * missing or the call fails. Results are illustrative and never persisted.
 */
export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "anon";

  // 4 demo estimates per IP per hour (best-effort, per-instance).
  if (!checkRateLimit(`estimate-demo:${ip}`, 4, 60 * 60_000)) {
    return err(
      "You've reached the demo limit for now — sign up free to keep generating estimates.",
      429
    );
  }

  const { data: body, error } = await parseBody(request, demoSchema);
  if (error) return error;

  const region = body.region ?? "UK";
  const vatRate = DEMO_VAT[region];

  // If no AI key is configured, skip straight to the illustrative sample.
  const hasKey =
    optionalServerEnv("ANTHROPIC_API_KEY") || optionalServerEnv("OPENAI_API_KEY");

  if (hasKey) {
    try {
      const ai = await extractEstimate({
        description: body.description.trim(),
        trade: body.trade?.trim() || "other",
        region,
        language: "en",
        defaultHourlyRate: DEMO_HOURLY[region],
        defaultCallOutFee: 0,
        anchors: [],
      });
      const totals = computeTotals(ai.line_items, vatRate);
      return ok({
        demo: true,
        fallback: false,
        region,
        job_title: ai.job_title,
        summary_for_customer: ai.summary_for_customer,
        line_items: totals.line_items,
        subtotal: totals.subtotal,
        vat_rate: vatRate,
        vat_amount: totals.vat_amount,
        total_inc_vat: totals.total_inc_vat,
      });
    } catch {
      // fall through to the canned sample below
    }
  }

  // Canned, instant fallback (keeps the marketing demo alive without a key).
  const sample = computeTotals(
    [
      { description: "Labour (1.5 hrs)", quantity: 1.5, unit_price: DEMO_HOURLY[region], kind: "labour" as const },
      { description: "Materials & sundries", quantity: 1, unit_price: 45, kind: "material" as const },
      { description: "Call-out", quantity: 1, unit_price: 0, kind: "call_out" as const },
    ],
    vatRate
  );
  return ok({
    demo: true,
    fallback: true,
    region,
    job_title: "Sample job estimate",
    summary_for_customer:
      "This is an illustrative sample. Sign up to generate a real, itemised quote from your own words, photos or voice — priced on your rates.",
    line_items: sample.line_items,
    subtotal: sample.subtotal,
    vat_rate: vatRate,
    vat_amount: sample.vat_amount,
    total_inc_vat: sample.total_inc_vat,
  });
}
