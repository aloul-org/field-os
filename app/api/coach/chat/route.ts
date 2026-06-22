import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { getRouteContext } from "@/lib/auth/session";
import { ok, err, unauthorized, forbidden, parseBody } from "@/lib/api/response";
import { runCoachTurn, type CoachMode } from "@/lib/ai/businessCoach";

export const runtime = "nodejs";

const bodySchema = z.object({
  mode: z.enum(["coach", "cfo"]),
  conversationId: z.string().uuid().optional(),
  message: z.string().trim().min(1).max(2000),
});

/** One turn of the AI CFO (/finance/ai-cfo) or Business Coach (/coach) chat. */
export async function POST(request: Request) {
  const { data: body, error: parseError } = await parseBody(request, bodySchema);
  if (parseError) return parseError;

  const mode = body.mode as CoachMode;
  // CFO is gated on finance access; the broader coach on coach access.
  const auth = await getRouteContext(mode === "cfo" ? "finance" : "coach");
  if ("error" in auth) {
    return auth.error === "unauthorized" ? unauthorized() : forbidden();
  }
  const ctx = auth.ctx;
  const supabase = createClient();

  // Resolve or create the conversation.
  let conversationId = body.conversationId ?? null;
  if (conversationId) {
    const { data: conv } = await supabase
      .from("ai_coach_conversations")
      .select("id")
      .eq("id", conversationId)
      .eq("company_id", ctx.company.id)
      .eq("user_id", ctx.user.id)
      .maybeSingle();
    if (!conv) conversationId = null;
  }
  if (!conversationId) {
    const { data: created } = await supabase
      .from("ai_coach_conversations")
      .insert({
        company_id: ctx.company.id,
        user_id: ctx.user.id,
        title: body.message.slice(0, 60),
      })
      .select("id")
      .single();
    if (!created) return err("Couldn't start the conversation.", 500);
    conversationId = created.id;
  }

  // Load prior turns for context.
  const { data: prior } = await supabase
    .from("ai_coach_messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(20);

  const history = [
    ...(prior ?? []).map((m) => ({ role: m.role, content: m.content })),
    { role: "user" as const, content: body.message },
  ];

  let result;
  try {
    result = await runCoachTurn({
      supabase,
      companyId: ctx.company.id,
      mode,
      history,
    });
  } catch {
    return err("The assistant is unavailable right now. Please try again.", 502);
  }

  // Persist the user message and the assistant reply (+ data_used for trust).
  await supabase.from("ai_coach_messages").insert([
    { conversation_id: conversationId, role: "user", content: body.message },
    {
      conversation_id: conversationId,
      role: "assistant",
      content: result.reply,
      data_used: result.dataUsed as unknown as object,
    },
  ]);

  return ok({ conversationId, reply: result.reply });
}
