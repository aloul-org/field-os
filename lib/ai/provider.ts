import { aiProvider } from "@/lib/env";
import * as anthropic from "@/lib/ai/anthropic";
import * as openai from "@/lib/ai/openai";

export type { ImageInput } from "@/lib/ai/anthropic";
export { parseJsonObject } from "@/lib/ai/anthropic";

/**
 * Active model IDs, switched by the AI_PROVIDER env var. Every caller should
 * use MODELS.live/MODELS.background rather than hardcoding a model string, so
 * the whole app moves together when the provider switches.
 */
export const MODELS = aiProvider() === "openai" ? openai.MODELS : anthropic.MODELS;

interface JsonPromptOptions {
  model?: string;
  system: string;
  userText: string;
  images?: anthropic.ImageInput[];
  maxTokens?: number;
}

/** Provider-agnostic JSON prompt — routes to Anthropic or OpenAI per AI_PROVIDER. */
export function runJsonPrompt(opts: JsonPromptOptions): Promise<unknown> {
  return aiProvider() === "openai" ? openai.runJsonPrompt(opts) : anthropic.runJsonPrompt(opts);
}

interface TextPromptOptions {
  model?: string;
  system: string;
  messages: { role: "user" | "assistant"; content: string }[];
  images?: anthropic.ImageInput[];
  maxTokens?: number;
}

/** Provider-agnostic text prompt — routes to Anthropic or OpenAI per AI_PROVIDER. */
export function runTextPrompt(opts: TextPromptOptions): Promise<string> {
  return aiProvider() === "openai" ? openai.runTextPrompt(opts) : anthropic.runTextPrompt(opts);
}
