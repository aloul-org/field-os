import Link from "next/link";
import { ArrowLeft, Bot } from "lucide-react";

import { requireSection } from "@/lib/auth/session";
import { CoachChat } from "@/components/coach/CoachChat";

export const metadata = { title: "AI CFO" };

const SUGGESTIONS = [
  "What's my profit trend this quarter?",
  "Which service line is most profitable?",
  "How does each technician compare on profit?",
  "Why am I losing quotes?",
];

export default async function AiCfoPage() {
  await requireSection("finance");

  return (
    <div>
      <Link
        href="/finance"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to finance
      </Link>
      <div className="mb-3 flex items-center gap-2">
        <Bot className="h-5 w-5 text-primary" />
        <h1 className="font-display text-xl font-bold tracking-tight">AI CFO</h1>
      </div>
      <p className="mb-3 text-sm text-muted-foreground">
        Scoped to your financial data — revenue, profit, margins, and quote performance.
      </p>
      <CoachChat mode="cfo" initialMessages={[]} suggestions={SUGGESTIONS} />
    </div>
  );
}
