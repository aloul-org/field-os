import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { createClient } from "@/lib/supabase/server";
import { requireSection } from "@/lib/auth/session";
import { canWrite } from "@/lib/auth/roles";
import { formatDateTime } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Call" };

const URGENCY_VARIANT: Record<string, "destructive" | "warning" | "secondary"> = {
  emergency: "destructive",
  urgent: "warning",
  normal: "secondary",
  flexible: "secondary",
};

export default async function CallDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const ctx = await requireSection("calls");
  const supabase = createClient();
  const t = await getTranslations("calls");
  const tStatus = await getTranslations("status");

  const { data: call } = await supabase
    .from("calls")
    .select("*")
    .eq("id", params.id)
    .eq("company_id", ctx.company.id)
    .maybeSingle();

  if (!call) notFound();

  return (
    <div>
      <Link
        href="/calls"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> {t("backToCalls")}
      </Link>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-2xl font-bold tracking-tight">
          <span className="font-mono">{call.caller_number}</span>
        </h1>
        {call.urgency && (
          <Badge variant={URGENCY_VARIANT[call.urgency] ?? "secondary"}>
            {tStatus(`urgency.${call.urgency}`)}
          </Badge>
        )}
        <span className="text-sm text-muted-foreground">
          {formatDateTime(call.created_at, ctx.company.region)}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {call.ai_summary && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("summary")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{call.ai_summary}</p>
              </CardContent>
            </Card>
          )}

          {call.transcript && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("transcript")}</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap font-sans text-sm text-muted-foreground">
                  {call.transcript}
                </pre>
              </CardContent>
            </Card>
          )}

          {call.recording_url && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("recording")}</CardTitle>
              </CardHeader>
              <CardContent>
                {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                <audio controls src={call.recording_url} className="w-full" />
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-3 lg:col-span-1">
          {call.lead_id && (
            <Button asChild variant="outline" className="w-full">
              <Link href={`/leads/${call.lead_id}`}>
                {t("viewLead")} <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          )}
          {canWrite(ctx.role) && (
            <Button asChild className="w-full">
              <Link
                href={
                  call.lead_id
                    ? `/estimates/new?leadId=${call.lead_id}`
                    : `/estimates/new?callId=${call.id}`
                }
              >
                {t("createEstimateFromCall")}
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
