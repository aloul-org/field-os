import { z } from "zod";

import { runJsonPrompt, MODELS } from "@/lib/ai/anthropic";
import type { LeadScore } from "@/lib/types/database";

const scoreResultSchema = z.object({
  score: z.enum(["hot", "warm", "cold"]),
  reason: z.string().min(1).max(280),
});

export interface LeadScoreResult {
  score: LeadScore;
  reason: string;
}

/**
 * Classify an inbound lead as hot/warm/cold (spec Module 2). Runs on the
 * high-volume background model (haiku). Best-effort: callers should treat a
 * thrown error as "leave unscored" rather than failing the lead creation.
 */
export async function scoreLead(input: {
  trade: string;
  message: string;
}): Promise<LeadScoreResult> {
  const system = `You are scoring inbound leads for a ${input.trade} business. Given the lead's message/transcript, classify as "hot", "warm", or "cold":
- hot: urgent/emergency language, specific address given, ready-to-proceed signals ("need this today", "how soon can you come")
- warm: clear job description but no urgency, or vague on timing
- cold: vague inquiry, explicit price-shopping language ("just getting quotes around"), or insufficient detail to act on
Respond with ONLY JSON: {"score": "hot|warm|cold", "reason": "one short sentence"}`;

  const raw = await runJsonPrompt({
    model: MODELS.background,
    system,
    userText: input.message.slice(0, 4000),
    maxTokens: 256,
  });

  const parsed = scoreResultSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error("Lead scoring returned an unexpected shape.");
  }
  return parsed.data;
}
