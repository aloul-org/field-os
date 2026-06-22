"use client";

import { useRef, useState } from "react";
import { Send, ImagePlus, Bot, Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

type MediaType = "image/png" | "image/jpeg" | "image/webp" | "image/gif";
interface Attached {
  data: string;
  mediaType: MediaType;
  preview: string;
}

const SUGGESTIONS = [
  "How do I bleed a radiator?",
  "What size cable for a 32A circuit?",
  "Why is this boiler showing a fault code?",
];

export function CopilotChat() {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [image, setImage] = useState<Attached | null>(null);
  const [loading, setLoading] = useState(false);

  async function attach(file: File) {
    const allowed: MediaType[] = ["image/png", "image/jpeg", "image/webp", "image/gif"];
    if (!allowed.includes(file.type as MediaType)) {
      toast({ variant: "destructive", description: "Use a PNG or JPEG photo." });
      return;
    }
    const buf = await file.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    const base64 = btoa(binary);
    setImage({
      data: base64,
      mediaType: file.type as MediaType,
      preview: URL.createObjectURL(file),
    });
  }

  async function send(text: string) {
    if (!text.trim() && !image) return;
    const next = [...messages, { role: "user" as const, content: text.trim() || "What is this?" }];
    setMessages(next);
    setInput("");
    const sentImage = image;
    setImage(null);
    setLoading(true);
    try {
      const res = await fetch("/api/tech/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next,
          image: sentImage ? { data: sentImage.data, mediaType: sentImage.mediaType } : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        toast({ variant: "destructive", description: json.error ?? "Couldn't reach the copilot." });
        return;
      }
      setMessages((m) => [...m, { role: "assistant", content: json.data.reply }]);
    } catch {
      toast({ variant: "destructive", description: "Couldn't reach the copilot." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-12rem)] flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto pb-3">
        {messages.length === 0 && (
          <div className="space-y-4 pt-6 text-center">
            <Bot className="mx-auto h-10 w-10 text-primary" />
            <p className="text-sm text-muted-foreground">
              Ask me anything about the job in front of you. I stick to trade know-how —
              for scheduling or pricing, check with the office.
            </p>
            <div className="space-y-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="block w-full rounded-md border border-border p-3 text-left text-sm"
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
              m.role === "user"
                ? "ml-auto bg-primary text-primary-foreground"
                : "bg-muted"
            )}
          >
            {m.content}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
          </div>
        )}
      </div>

      {image && (
        <div className="mb-2 flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image.preview} alt="attachment" className="h-12 w-12 rounded object-cover" />
          <button onClick={() => setImage(null)} aria-label="Remove image">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) attach(f);
            if (fileRef.current) fileRef.current.value = "";
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-12 w-12 shrink-0"
          onClick={() => fileRef.current?.click()}
          aria-label="Attach photo"
        >
          <ImagePlus className="h-5 w-5" />
        </Button>
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
          placeholder="Ask the copilot…"
          className="min-h-12 resize-none"
        />
        <Button
          type="button"
          size="icon"
          className="h-12 w-12 shrink-0"
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
