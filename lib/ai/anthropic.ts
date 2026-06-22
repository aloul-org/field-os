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

interface TextPromptOptions {
  model?: string;
  system: string;
  messages: { role: "user" | "assistant"; content: string }[];
  images?: ImageInput[];
  maxTokens?: number;
}

/**
 * Run a prompt that returns free-form prose (job-report formatting, copilot
 * chat). Multi-turn via `messages`; an optional image is attached to the final
 * user turn for vision questions.
 */
export async function runTextPrompt({
  model = MODELS.live,
  system,
  messages,
  images,
  maxTokens = 1024,
}: TextPromptOptions): Promise<string> {
  const anthropic = getAnthropic();

  const apiMessages: Anthropic.MessageParam[] = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  // Attach images to the last user message, if any.
  if (images && images.length > 0 && apiMessages.length > 0) {
    const last = apiMessages[apiMessages.length - 1];
    if (last.role === "user") {
      const blocks: Anthropic.ContentBlockParam[] = images.map((img) => ({
        type: "image",
        source: { type: "base64", media_type: img.mediaType, data: img.data },
      }));
      blocks.push({ type: "text", text: typeof last.content === "string" ? last.content : "" });
      last.content = blocks;
    }
  }

  const response = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    system,
    messages: apiMessages,
  });

  if (response.stop_reason === "refusal") {
    throw new Error("The AI declined to process this request.");
  }

  return response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
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
