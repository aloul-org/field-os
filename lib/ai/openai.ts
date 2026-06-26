import OpenAI from "openai";

import { serverEnv } from "@/lib/env";
import { parseJsonObject, type ImageInput } from "@/lib/ai/anthropic";

/**
 * OpenAI model selection, mirroring the role split in anthropic.ts:
 * - gpt-5.5 for live, user-facing calls (estimating, coach, CFO)
 * - gpt-5.4-mini for high-volume background work (lead scoring, nudges)
 */
export const MODELS = {
  live: "gpt-5.5",
  background: "gpt-5.4-mini",
} as const;

let client: OpenAI | null = null;

/** Lazily-constructed singleton — throws a clear error if the key is unset. */
export function getOpenAI(): OpenAI {
  if (!client) {
    client = new OpenAI({ apiKey: serverEnv("OPENAI_API_KEY") });
  }
  return client;
}

interface JsonPromptOptions {
  model?: string;
  system: string;
  userText: string;
  images?: ImageInput[];
  maxTokens?: number;
}

function imageContent(img: ImageInput): OpenAI.Chat.ChatCompletionContentPart {
  return {
    type: "image_url",
    image_url: { url: `data:${img.mediaType};base64,${img.data}` },
  };
}

/**
 * OpenAI counterpart to anthropic.ts's runJsonPrompt — same contract: returns
 * parsed-but-unvalidated JSON, every caller validates with its own Zod schema,
 * and all money is recomputed in code regardless of what the model returns.
 */
export async function runJsonPrompt({
  model = MODELS.live,
  system,
  userText,
  images,
  maxTokens = 2048,
}: JsonPromptOptions): Promise<unknown> {
  const openai = getOpenAI();

  const content: OpenAI.Chat.ChatCompletionContentPart[] = [];
  for (const img of images ?? []) content.push(imageContent(img));
  content.push({ type: "text", text: userText });

  const response = await openai.chat.completions.create({
    model,
    max_completion_tokens: maxTokens,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content },
    ],
  });

  const text = response.choices[0]?.message?.content ?? "";
  return parseJsonObject(text);
}

interface TextPromptOptions {
  model?: string;
  system: string;
  messages: { role: "user" | "assistant"; content: string }[];
  images?: ImageInput[];
  maxTokens?: number;
}

/** OpenAI counterpart to anthropic.ts's runTextPrompt (free-form prose, multi-turn). */
export async function runTextPrompt({
  model = MODELS.live,
  system,
  messages,
  images,
  maxTokens = 1024,
}: TextPromptOptions): Promise<string> {
  const openai = getOpenAI();

  const apiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: system },
    ...messages.map((m) => ({ role: m.role, content: m.content }) as OpenAI.Chat.ChatCompletionMessageParam),
  ];

  // Attach images to the last user message, if any.
  if (images && images.length > 0) {
    const last = apiMessages[apiMessages.length - 1];
    if (last.role === "user") {
      const blocks: OpenAI.Chat.ChatCompletionContentPart[] = images.map(imageContent);
      blocks.push({ type: "text", text: typeof last.content === "string" ? last.content : "" });
      last.content = blocks;
    }
  }

  const response = await openai.chat.completions.create({
    model,
    max_completion_tokens: maxTokens,
    messages: apiMessages,
  });

  return response.choices[0]?.message?.content?.trim() ?? "";
}
