import { z } from "zod";

import { getRouteContext } from "@/lib/auth/session";
import { ok, err, unauthorized, forbidden, parseBody } from "@/lib/api/response";
import { runTextPrompt } from "@/lib/ai/anthropic";

export const runtime = "nodejs";

const COPILOT_SYSTEM = `You help tradespeople with practical, safe, on-the-job questions about their trade. You do not have access to scheduling, pricing, or customer financial data, and you do not provide it even if asked — redirect those questions to the office. Give clear, concise, step-by-step guidance. Always flag genuine safety hazards (gas, electrical, structural) and when a qualified/certified professional or isolation of supply is required.`;

const bodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4000),
      })
    )
    .min(1)
    .max(20),
  image: z
    .object({
      data: z.string().min(1),
      mediaType: z.enum(["image/png", "image/jpeg", "image/webp", "image/gif"]),
    })
    .optional(),
});

/** Scoped trade-knowledge copilot for technicians (spec Module 7). */
export async function POST(request: Request) {
  const auth = await getRouteContext();
  if ("error" in auth) {
    return auth.error === "unauthorized" ? unauthorized() : forbidden();
  }
  if (auth.ctx.role !== "technician") return forbidden();

  const { data: body, error } = await parseBody(request, bodySchema);
  if (error) return error;

  try {
    const reply = await runTextPrompt({
      system: COPILOT_SYSTEM,
      messages: body.messages,
      images: body.image ? [body.image] : undefined,
      maxTokens: 1024,
    });
    return ok({ reply });
  } catch {
    return err("The copilot is unavailable right now. Please try again.", 502);
  }
}
