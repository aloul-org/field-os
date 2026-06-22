"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Bot, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

export function CoachChat({
  mode,
  conversationId,
  initialMessages,
  suggestions,
}: {
  mode: "coach" | "cfo";
  conversationId?: string;
  initialMessages: Msg[];
  suggestions: string[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Msg[]>(initialMessages);
  const [convId, setConvId] = useState(conversationId);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const next = [...messages, { role: "user" as const, content: text.trim() }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/coach/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, conversationId: convId, message: text.trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        toast({ variant: "destructive", description: json.error ?? "Couldn't reach the assistant." });
        setMessages(messages); // roll back the optimistic user turn
        return;
      }
      setMessages((m) => [...m, { role: "assistant", content: json.data.reply }]);
      const isNew = !convId;
      setConvId(json.data.conversationId);
      // Refresh the conversation rail so a new chat appears.
      if (isNew) router.refresh();
    } catch {
      toast({ variant: "destructive", description: "Couldn't reach the assistant." });
      setMessages(messages);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-13rem)] flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto pb-3">
        {messages.length === 0 && (
          <div className="space-y-4 pt-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Bot className="h-5 w-5 text-primary" />
              <p className="text-sm">
                {mode === "cfo"
                  ? "Ask about revenue, profit, margins and what's driving them."
                  : "Ask me anything about your business — I'll dig into your numbers."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-pill border border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm",
              m.role === "user" ? "ml-auto bg-primary text-primary-foreground" : "bg-muted"
            )}
          >
            {m.content}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Looking at your numbers…
          </div>
        )}
      </div>

      <div className="flex items-end gap-2 border-t pt-3">
        <Textarea
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          placeholder={mode === "cfo" ? "Ask the CFO…" : "Ask your coach…"}
          className="min-h-11 resize-none"
        />
        <Button
          size="icon"
          className="h-11 w-11 shrink-0"
          disabled={loading}
          onClick={() => send(input)}
          aria-label="Send"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
