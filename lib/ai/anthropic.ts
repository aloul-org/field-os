import Anthropic from "@anthropic-ai/sdk";

import { serverEnv } from "@/lib/env";

/**
 * Claude model selection (per the platform spec, NOT the SDK default):
 * - sonnet-4-6 for live, user-facing calls (estimating, coach, CFO)
 * - haiku-4-5 for high-volume background work (lead scoring, nudges)
 */
export const MODELS = {
  live: "claude-sonnet-4-6",
  background: "claude-haiku-4-5",
} as const;

let client: Anthropic | null = null;

/** Lazily-constructed singleton — throws a clear error if the key is unset. */
export function getAnthropic(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: serverEnv("ANTHROPIC_API_KEY") });
  }
  return client;
}

export interface ImageInput {
  /** Base64-encoded image data (no data: prefix). */
  data: string;
  mediaType: "image/png" | "image/jpeg" | "image/webp" | "image/gif";
}

interface JsonPromptOptions {
  model?: string;
  system: string;
  userText: string;
  images?: ImageInput[];
  maxTokens?: number;
}

/**
 * Run a prompt that must return a single JSON object and return the parsed
 * (but un-validated) value. We use prompt-based JSON rather than the SDK's
 * structured-output helper so behaviour is independent of Zod major versions —
 * every caller validates the result against its own Zod schema, and all money
 * is recomputed in code regardless of what the model returns.
 */
export async function runJsonPrompt({
  model = MODELS.live,
  system,
  userText,
  images,
  maxTokens = 2048,
}: JsonPromptOptions): Promise<unknown> {
  const anthropic = getAnthropic();

  const content: Anthropic.ContentBlockParam[] = [];
  for (const img of images ?? []) {
    content.push({
      type: "image",
      source: { type: "base64", media_type: img.mediaType, data: img.data },
    });
  }
  content.push({ type: "text", text: userText });

  const response = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content }],
  });

  if (response.stop_reason === "refusal") {
    throw new Error("The AI declined to process this request.");
  }

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();

  return parseJsonObject(text);
}

/**
 * Extract the first JSON object from a model response, tolerating markdown
 * code fences or a stray sentence around it.
 */
export function parseJsonObject(text: string): unknown {
  let candidate = text.trim();
  // Strip ```json ... ``` fences if present.
  const fence = candidate.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) candidate = fence[1].trim();
  // Fall back to the first {...} span.
  if (!candidate.startsWith("{")) {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      candidate = candidate.slice(start, end + 1);
    }
  }
  try {
    return JSON.parse(candidate);
  } catch {
    throw new Error("The AI response was not valid JSON.");
  }
}
