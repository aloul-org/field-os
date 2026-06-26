import { z } from "zod";

import { MODELS, runJsonPrompt, type ImageInput } from "@/lib/ai/provider";
import { tradeLabel } from "@/lib/trades";
import type { AppLanguage, Region } from "@/lib/types/database";

// ── Extraction output (what the model returns; money is recomputed in code) ──
const aiLineItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().nonnegative(),
  unit_price: z.number().nonnegative(),
  kind: z.enum(["labour", "material", "call_out", "other"]).optional(),
});

const aiEstimateSchema = z.object({
  job_title: z.string().min(1),
  summary_for_customer: z.string().min(1),
  line_items: z.array(aiLineItemSchema).min(1),
  estimated_duration_hours: z.number().nonnegative().nullable().optional(),
  confidence: z.enum(["high", "medium", "low"]),
  flags: z.array(z.string()).default([]),
});

export type AiEstimate = z.infer<typeof aiEstimateSchema>;

export interface PricingAnchor {
  job_title: string;
  total_inc_vat: number;
  summary: string;
}

export interface ExtractEstimateInput {
  /** Raw job description (typed, or a Whisper voice transcript). */
  description: string;
  trade: string;
  region: Region;
  language: AppLanguage;
  defaultHourlyRate: number | null;
  defaultCallOutFee: number | null;
  /** Up to 5 recent accepted estimates in the same trade_category. */
  anchors: PricingAnchor[];
  /** Optional job photos for photo-based estimating (vision). */
  images?: ImageInput[];
}

const currencyFor = (region: Region) => (region === "DE" ? "EUR" : "GBP");

/**
 * Core estimate extraction (text / voice / photo). Injects the company's recent
 * accepted estimates as pricing anchors (Historical Estimate Engine) and asks
 * the model to stay within ~20% of them unless the scope clearly differs. The
 * model never computes totals — it returns line items only; callers recompute
 * all money with computeTotals().
 */
export async function extractEstimate(
  input: ExtractEstimateInput
): Promise<AiEstimate> {
  const currency = currencyFor(input.region);
  const anchorsBlock =
    input.anchors.length > 0
      ? input.anchors
          .map(
            (a, i) =>
              `${i + 1}. "${a.job_title}" — ${currency} ${a.total_inc_vat.toFixed(
                2
              )} (${a.summary})`
          )
          .join("\n")
      : "(no accepted estimates yet — use the default rates and your judgement)";

  const system = `You are an expert estimator for a ${tradeLabel(
    input.trade
  )} business operating in ${input.region}. You produce accurate, itemised job estimates.

Pricing context:
- Default hourly labour rate: ${
    input.defaultHourlyRate != null ? `${currency} ${input.defaultHourlyRate}` : "not set"
  }
- Default call-out fee: ${
    input.defaultCallOutFee != null ? `${currency} ${input.defaultCallOutFee}` : "not set"
  }
- The company's 5 most recent ACCEPTED estimates for similar work (your pricing anchors):
${anchorsBlock}

Rules:
- Break the job into clear line items. Each item has: description, quantity, unit_price, and kind ("labour" | "material" | "call_out" | "other"). All prices EXCLUDE VAT.
- Stay within roughly 20% of the anchor prices for comparable work, UNLESS the job description clearly describes a different scope — then price it on its merits and add a flag explaining why.
- Do NOT compute subtotal, VAT, or totals. Return line items only; the system recalculates all money.
- Write "summary_for_customer" in ${input.language === "de" ? "German" : "English"}, in plain, friendly language a customer understands. No internal jargon.
- Set "confidence" to "high", "medium", or "low" based on how complete the information is.
- Use "flags" for anything the contractor should double-check (assumptions made, missing info, recommend a site visit, etc.).

Respond with ONLY a JSON object of this exact shape, no prose:
{"job_title": string, "summary_for_customer": string, "line_items": [{"description": string, "quantity": number, "unit_price": number, "kind": "labour"|"material"|"call_out"|"other"}], "estimated_duration_hours": number|null, "confidence": "high"|"medium"|"low", "flags": [string]}`;

  const userText = input.images?.length
    ? `Here ${input.images.length === 1 ? "is a photo" : "are photos"} of the job${
        input.description ? `, plus this description:\n\n${input.description}` : "."
      }\n\nProduce an itemised estimate.`
    : `Job description:\n\n${input.description}\n\nProduce an itemised estimate.`;

  const raw = await runJsonPrompt({
    model: MODELS.live,
    system,
    userText,
    images: input.images,
    maxTokens: 2048,
  });

  return aiEstimateSchema.parse(raw);
}

// ── Win probability ──────────────────────────────────────────────────────────
const winProbabilitySchema = z.object({
  win_probability: z.number().min(0).max(100),
  factors: z.array(z.string()).min(1).max(4),
});

export type WinProbability = z.infer<typeof winProbabilitySchema>;

export interface WinProbabilityInput {
  price: number;
  trade: string;
  region: Region;
  /** Real stats computed server-side — the model never invents the base rate. */
  winRatePct: number; // historical win rate for this trade_category, last 90 days
  pricePercentile: number; // this price's percentile vs recent accepted estimates (0-100)
  recentAverage: number | null;
  sampleSize: number;
}

/**
 * Estimate the probability the customer accepts this quote. All base rates and
 * comparisons are computed in code and passed in — the model only narrates a
 * number and 2-3 driving factors from real data.
 */
export async function scoreWinProbability(
  input: WinProbabilityInput
): Promise<WinProbability> {
  const currency = currencyFor(input.region);
  const system = `You estimate the probability that a customer accepts a quote, using the real statistics provided. Do not invent base rates — reason only from the numbers given.

Respond with ONLY JSON: {"win_probability": number (0-100), "factors": ["string", "string"]}`;

  const userText = `Trade: ${tradeLabel(input.trade)}
This quote's total (inc VAT): ${currency} ${input.price.toFixed(2)}
Company's historical win rate for similar jobs (last 90 days): ${input.winRatePct.toFixed(
    0
  )}% over ${input.sampleSize} comparable estimates
This price's percentile vs recent accepted estimates for this job type: ${input.pricePercentile.toFixed(
    0
  )}th percentile${
    input.recentAverage != null
      ? `\nRecent average accepted total for this job type: ${currency} ${input.recentAverage.toFixed(
          2
        )}`
      : ""
  }

Give the acceptance probability and 2-3 short factors driving it.`;

  const raw = await runJsonPrompt({
    model: MODELS.background,
    system,
    userText,
    maxTokens: 512,
  });

  const parsed = winProbabilitySchema.parse(raw);
  return {
    win_probability: Math.round(parsed.win_probability),
    factors: parsed.factors,
  };
}
