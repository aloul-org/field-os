import { z } from "zod";

import { runJsonPrompt, MODELS } from "@/lib/ai/provider";
import type { Urgency } from "@/lib/types/database";

/**
 * The AI voice receptionist runs a deterministic 3-slot conversation (issue →
 * address → urgency) rather than a free-form LLM dialogue per turn. This keeps
 * the TwiML round-trip fast and predictable; the LLM is used once at the end to
 * summarise the call and infer structured urgency. This is a deliberate v1
 * simplification of the spec's "conversational slot-filling loop" — the slots
 * collected are identical, and the call summary still feeds lead scoring.
 */
export type VoiceStep = "issue" | "address" | "urgency" | "done";

export const VOICE_PROMPTS: Record<Exclude<VoiceStep, "done">, string> = {
  issue: "Hi, thanks for calling. I'm the virtual assistant. In a few words, what do you need help with today?",
  address: "Got it. What's the address where the work is needed?",
  urgency: "Thank you. Lastly, how urgent is this — is it an emergency, or can it wait a few days?",
};

export function nextStep(step: VoiceStep): VoiceStep {
  if (step === "issue") return "address";
  if (step === "address") return "urgency";
  return "done";
}

const summarySchema = z.object({
  summary: z.string().min(1).max(600),
  urgency: z.enum(["emergency", "urgent", "normal", "flexible"]),
  job_description: z.string().min(1).max(600),
});

export interface CallSummary {
  summary: string;
  urgency: Urgency;
  job_description: string;
}

/** Summarise a completed receptionist call into structured fields. */
export async function summariseCall(input: {
  trade: string;
  issue: string;
  address: string;
  urgency: string;
}): Promise<CallSummary> {
  const system = `You summarise inbound phone calls for a ${input.trade} business. The caller answered three questions. Produce a short internal summary for the owner, a clean one-line job description, and classify urgency.
Urgency: "emergency" (danger/no service now, e.g. gas leak, flooding, no heat in winter), "urgent" (needs attention within a day), "normal" (within a few days), "flexible" (no rush).
Respond with ONLY JSON: {"summary": "...", "urgency": "emergency|urgent|normal|flexible", "job_description": "..."}`;

  const userText = `Issue: ${input.issue}\nAddress: ${input.address}\nUrgency (caller's words): ${input.urgency}`;

  const raw = await runJsonPrompt({
    model: MODELS.background,
    system,
    userText,
    maxTokens: 400,
  });

  const parsed = summarySchema.safeParse(raw);
  if (!parsed.success) {
    // Fall back to raw transcript if the model misbehaves — never lose the lead.
    return {
      summary: `Issue: ${input.issue}. Address: ${input.address}. Urgency: ${input.urgency}.`,
      urgency: "normal",
      job_description: input.issue.slice(0, 300),
    };
  }
  return parsed.data;
}

/** Build the running transcript stored on the call row as slots are filled. */
export function appendTranscript(
  existing: string | null,
  speaker: "AI" | "Caller",
  text: string
): string {
  const line = `${speaker}: ${text}`;
  return existing ? `${existing}\n${line}` : line;
}
