import Link from "next/link";
import { Phone, PhoneMissed, PhoneForwarded, Voicemail } from "lucide-react";

import { getTranslations } from "next-intl/server";

import { createClient } from "@/lib/supabase/server";
import { requireSection } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/format";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CallRow } from "@/lib/types/database";

export const metadata = { title: "Calls" };

const STATUS_ICON: Record<CallRow["status"], typeof Phone> = {
  in_progress: Phone,
  completed: Phone,
  voicemail: Voicemail,
  missed: PhoneMissed,
  forwarded_to_human: PhoneForwarded,
  failed: PhoneMissed,
};

const URGENCY_VARIANT: Record<string, "destructive" | "warning" | "secondary"> = {
  emergency: "destructive",
  urgent: "warning",
  normal: "secondary",
  flexible: "secondary",
};

function formatDuration(seconds: number | null): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default async function CallsPage() {
  const ctx = await requireSection("calls");
  const supabase = createClient();
  const t = await getTranslations("calls");

  const { data: calls } = await supabase
    .from("calls")
    .select("id, caller_number, status, urgency, ai_summary, duration_seconds, created_at")
    .eq("company_id", ctx.company.id)
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div>
      <PageHeader title={t("title")} description={t("description")} />

      {!calls || calls.length === 0 ? (
        <EmptyState icon={Phone} title={t("emptyTitle")} description={t("emptyBody")} />
      ) : (
        <Card className="divide-y">
          {calls.map((c) => {
            const Icon = STATUS_ICON[c.status];
            return (
              <Link
                key={c.id}
                href={`/calls/${c.id}`}
                className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-muted/50"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-mono font-medium">{c.caller_number}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {c.ai_summary ?? "No summary"}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {c.urgency && (
                    <Badge variant={URGENCY_VARIANT[c.urgency] ?? "secondary"} className="capitalize">
                      {c.urgency}
                    </Badge>
                  )}
                  <span className="hidden text-sm text-muted-foreground sm:block">
                    {formatDuration(c.duration_seconds)}
                  </span>
                  <span className="hidden text-xs text-muted-foreground md:block">
                    {formatDateTime(c.created_at, ctx.company.region)}
                  </span>
                </div>
              </Link>
            );
          })}
        </Card>
      )}
    </div>
  );
}
