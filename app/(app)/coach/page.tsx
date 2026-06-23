import Link from "next/link";
import { Bot, Plus, MessageSquare } from "lucide-react";

import { getTranslations } from "next-intl/server";

import { createClient } from "@/lib/supabase/server";
import { requireSection } from "@/lib/auth/session";
import { computeNudges } from "@/lib/insights/nudges";
import { CoachChat } from "@/components/coach/CoachChat";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata = { title: "Coach" };

// Fallback chips when nothing notable is detected in the data this week.
const DEFAULT_SUGGESTIONS = [
  "Why did we lose estimates last month?",
  "Which technician is most profitable?",
  "How can I increase revenue?",
  "How is my lead conversion looking?",
];

export default async function CoachPage({
  searchParams,
}: {
  searchParams: { c?: string };
}) {
  const ctx = await requireSection("coach");
  const supabase = createClient();
  const t = await getTranslations("coach");

  const { data: conversations } = await supabase
    .from("ai_coach_conversations")
    .select("id, title, created_at")
    .eq("company_id", ctx.company.id)
    .eq("user_id", ctx.user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  // Dynamic chips surface only genuinely notable issues; pad to 4 with defaults.
  const nudges = await computeNudges(supabase, ctx.company.id);
  const suggestions = [
    ...nudges.map((n) => n.question),
    ...DEFAULT_SUGGESTIONS,
  ].slice(0, 4);

  const activeId = searchParams.c;
  let initialMessages: { role: "user" | "assistant"; content: string }[] = [];
  if (activeId) {
    // Confirm the conversation belongs to this user before loading messages.
    const { data: conv } = await supabase
      .from("ai_coach_conversations")
      .select("id")
      .eq("id", activeId)
      .eq("company_id", ctx.company.id)
      .eq("user_id", ctx.user.id)
      .maybeSingle();
    if (conv) {
      const { data: msgs } = await supabase
        .from("ai_coach_messages")
        .select("role, content")
        .eq("conversation_id", activeId)
        .order("created_at", { ascending: true });
      initialMessages = (msgs ?? []).map((m) => ({ role: m.role, content: m.content }));
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-4">
      <aside className="lg:col-span-1">
        <Button asChild variant="outline" className="mb-3 w-full">
          <Link href="/coach">
            <Plus className="h-4 w-4" /> {t("newChat")}
          </Link>
        </Button>
        <nav className="space-y-1">
          {(conversations ?? []).map((c) => (
            <Link
              key={c.id}
              href={`/coach?c=${c.id}`}
              className={cn(
                "flex items-center gap-2 truncate rounded-md px-3 py-2 text-sm",
                activeId === c.id
                  ? "bg-muted font-medium"
                  : "text-muted-foreground hover:bg-muted/50"
              )}
            >
              <MessageSquare className="h-4 w-4 shrink-0" />
              <span className="truncate">{c.title ?? "Conversation"}</span>
            </Link>
          ))}
        </nav>
      </aside>

      <div className="lg:col-span-3">
        <div className="mb-3 flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <h1 className="font-display text-xl font-bold tracking-tight">{t("title")}</h1>
        </div>
        <CoachChat
          key={activeId ?? "new"}
          mode="coach"
          conversationId={activeId}
          initialMessages={initialMessages}
          suggestions={suggestions}
        />
      </div>
    </div>
  );
}
