import type Anthropic from "@anthropic-ai/sdk";
import type OpenAI from "openai";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/types/database";
import { aiProvider } from "@/lib/env";
import { getAnthropic, MODELS as ANTHROPIC_MODELS } from "@/lib/ai/anthropic";
import { getOpenAI, MODELS as OPENAI_MODELS } from "@/lib/ai/openai";
import { toolSpecs, runTool } from "@/lib/ai/coachTools";

export type CoachMode = "coach" | "cfo";

const SYSTEMS: Record<CoachMode, string> = {
  cfo: `You are the AI CFO for a field-service business. Answer the owner's financial questions using ONLY the data tools provided — never invent numbers. Call the tools you need, then explain the result in plain, practical language. Quote concrete figures from the tool results. If the data is empty, say so honestly. Keep answers concise and actionable. You have no access to anything beyond the financial tools.`,
  coach: `You are the AI Business Coach for a field-service business — a sharp, practical advisor to the owner. Answer using ONLY the data tools provided; never invent numbers. Call the tools you need, then give clear, specific, actionable advice grounded in the figures. Cover operations and finance. Be encouraging but honest about problems. Keep answers concise.`,
};

const MAX_TOOL_ROUNDS = 5;

export interface CoachResult {
  reply: string;
  dataUsed: { tool: string; args: unknown; result: unknown }[];
}

/**
 * Run one assistant turn of the CFO/Coach chat with tool-calling (spec Modules
 * 9 & 12). Routes to the Anthropic or OpenAI implementation per AI_PROVIDER —
 * both speak a near-identical tool-calling shape, but the SDK response shapes
 * differ enough (content blocks vs. tool_calls array) to need separate loops.
 */
export function runCoachTurn(opts: {
  supabase: SupabaseClient<Database>;
  companyId: string;
  mode: CoachMode;
  history: { role: "user" | "assistant"; content: string }[];
}): Promise<CoachResult> {
  return aiProvider() === "openai" ? runCoachTurnOpenAI(opts) : runCoachTurnAnthropic(opts);
}

function toOpenAiTools(specs: Anthropic.Tool[]): OpenAI.Chat.ChatCompletionTool[] {
  return specs.map((s) => ({
    type: "function",
    function: {
      name: s.name,
      description: s.description,
      parameters: s.input_schema as Record<string, unknown>,
    },
  }));
}

/**
 * OpenAI tool-calling loop (chat.completions with `tools`/`tool_calls`):
 * model → tool_calls → role:"tool" results → model, until it returns plain text.
 */
async function runCoachTurnOpenAI(opts: {
  supabase: SupabaseClient<Database>;
  companyId: string;
  mode: CoachMode;
  history: { role: "user" | "assistant"; content: string }[];
}): Promise<CoachResult> {
  const openai = getOpenAI();
  const tools = toOpenAiTools(toolSpecs(opts.mode));
  const dataUsed: CoachResult["dataUsed"] = [];

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEMS[opts.mode] },
    ...opts.history.map((m) => ({ role: m.role, content: m.content }) as OpenAI.Chat.ChatCompletionMessageParam),
  ];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const response = await openai.chat.completions.create({
      model: OPENAI_MODELS.live,
      max_completion_tokens: 1500,
      tools,
      messages,
    });

    const message = response.choices[0]?.message;
    const toolCalls = message?.tool_calls ?? [];

    if (toolCalls.length === 0) {
      const reply = message?.content?.trim() ?? "";
      return { reply: reply || "I couldn't find anything to report on that.", dataUsed };
    }

    messages.push({ role: "assistant", content: message?.content ?? null, tool_calls: toolCalls });
    // toOpenAiTools() only ever declares function-type tools, so every call back is a function call.
    for (const call of toolCalls) {
      if (call.type !== "function") continue;
      const args = call.function.arguments ? (JSON.parse(call.function.arguments) as Record<string, unknown>) : {};
      const result = await runTool(call.function.name, opts.supabase, opts.companyId, args);
      dataUsed.push({ tool: call.function.name, args, result });
      messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(result) });
    }
  }

  const final = await openai.chat.completions.create({
    model: OPENAI_MODELS.live,
    max_completion_tokens: 800,
    messages: [...messages, { role: "user", content: "Please summarise your answer now using what you have." }],
  });
  const reply = final.choices[0]?.message?.content?.trim() ?? "";
  return { reply: reply || "I couldn't complete that analysis.", dataUsed };
}

/** Anthropic tool-calling loop (messages.create with `tools`/tool_use content blocks). */
async function runCoachTurnAnthropic(opts: {
  supabase: SupabaseClient<Database>;
  companyId: string;
  mode: CoachMode;
  history: { role: "user" | "assistant"; content: string }[];
}): Promise<CoachResult> {
  const anthropic = getAnthropic();
  const tools = toolSpecs(opts.mode);
  const dataUsed: CoachResult["dataUsed"] = [];

  const messages: Anthropic.MessageParam[] = opts.history.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const response = await anthropic.messages.create({
      model: ANTHROPIC_MODELS.live,
      max_tokens: 1500,
      system: SYSTEMS[opts.mode],
      tools,
      messages,
    });

    const toolUses = response.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
    );

    if (response.stop_reason !== "tool_use" || toolUses.length === 0) {
      const reply = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("")
        .trim();
      return { reply: reply || "I couldn't find anything to report on that.", dataUsed };
    }

    // Record the assistant's tool-use turn, then run each tool.
    messages.push({ role: "assistant", content: response.content });
    const results: Anthropic.ToolResultBlockParam[] = [];
    for (const use of toolUses) {
      const args = (use.input ?? {}) as Record<string, unknown>;
      const result = await runTool(use.name, opts.supabase, opts.companyId, args);
      dataUsed.push({ tool: use.name, args, result });
      results.push({
        type: "tool_result",
        tool_use_id: use.id,
        content: JSON.stringify(result),
      });
    }
    messages.push({ role: "user", content: results });
  }

  // Ran out of tool rounds — ask for a final summary with no further tools.
  const final = await anthropic.messages.create({
    model: ANTHROPIC_MODELS.live,
    max_tokens: 800,
    system: SYSTEMS[opts.mode],
    messages: [
      ...messages,
      { role: "user", content: "Please summarise your answer now using what you have." },
    ],
  });
  const reply = final.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
  return { reply: reply || "I couldn't complete that analysis.", dataUsed };
}
