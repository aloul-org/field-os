import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, MapPin, Phone, PhoneCall } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { createClient } from "@/lib/supabase/server";
import { requireSection } from "@/lib/auth/session";
import { canWrite } from "@/lib/auth/roles";
import { formatDateTime } from "@/lib/format";
import { LEAD_STATUS_META } from "@/lib/leads/status";
import { LeadScoreBadge } from "@/components/leads/LeadScoreBadge";
import { LeadActions } from "@/components/leads/LeadActions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Lead" };

/** Rough skills↔lead match: does any of the tech's skills appear in the text? */
function isSuggested(skills: string[], haystack: string): boolean {
  const lower = haystack.toLowerCase();
  return skills.some((s) => s && lower.includes(s.toLowerCase()));
}

export default async function LeadDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const ctx = await requireSection("leads");
  const supabase = createClient();
  const writable = canWrite(ctx.role);
  const t = await getTranslations("leads");
  const tStatus = await getTranslations("status");

  const { data: lead } = await supabase
    .from("leads")
    .select("*")
    .eq("id", params.id)
    .eq("company_id", ctx.company.id)
    .maybeSingle();

  if (!lead) notFound();

  const [{ data: calls }, { data: members }] = await Promise.all([
    supabase
      .from("calls")
      .select("id, caller_number, status, urgency, ai_summary, duration_seconds, created_at")
      .eq("lead_id", lead.id)
      .eq("company_id", ctx.company.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("team_members")
      .select("id, name, skills, role")
      .eq("company_id", ctx.company.id)
      .eq("is_active", true)
      .not("invite_accepted_at", "is", null),
  ]);

  const status = LEAD_STATUS_META[lead.status];
  const matchText = [lead.job_description, lead.raw_message].filter(Boolean).join(" ");

  // Suggested techs (skills match) first, then the rest. Owners/admins excluded
  // from "field" suggestion but still assignable.
  const team = (members ?? [])
    .map((m) => ({
      id: m.id,
      name: m.name,
      suggested: m.role === "technician" && isSuggested(m.skills ?? [], matchText),
    }))
    .sort((a, b) => Number(b.suggested) - Number(a.suggested));

  return (
    <div>
      <Link
        href="/leads"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> {t("backToLeads")}
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-2xl font-bold tracking-tight">
              {lead.contact_name ?? t("newEnquiry")}
            </h1>
            <LeadScoreBadge score={lead.score} />
            <Badge variant={status.variant}>{tStatus(`lead.${lead.status}`)}</Badge>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("enquiry")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {lead.score_reason && (
                <p className="rounded-md bg-muted p-3 text-muted-foreground">
                  <span className="font-medium text-foreground">{t("whyThisScore")} </span>
                  {lead.score_reason}
                </p>
              )}
              <p className="whitespace-pre-wrap">
                {lead.job_description || lead.raw_message || t("noDetailsCaptured")}
              </p>
              <dl className="grid gap-2 text-muted-foreground sm:grid-cols-2">
                {lead.contact_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <a href={`tel:${lead.contact_phone}`} className="hover:text-foreground">
                      {lead.contact_phone}
                    </a>
                  </div>
                )}
                {lead.contact_email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <a href={`mailto:${lead.contact_email}`} className="hover:text-foreground">
                      {lead.contact_email}
                    </a>
                  </div>
                )}
                {lead.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {lead.address}
                  </div>
                )}
              </dl>
              <p className="text-xs text-muted-foreground">
                {tStatus(`leadSource.${lead.source}`)} · {formatDateTime(lead.created_at, ctx.company.region)}
              </p>
            </CardContent>
          </Card>

          {calls && calls.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("callHistory")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {calls.map((c) => (
                  <Link
                    key={c.id}
                    href={`/calls/${c.id}`}
                    className="flex items-start gap-3 rounded-md border p-3 text-sm hover:bg-muted/50"
                  >
                    <PhoneCall className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="truncate">
                        <span className="font-mono">{c.caller_number}</span>
                        {c.urgency ? ` · ${tStatus(`urgency.${c.urgency}`)}` : ""}
                      </p>
                      {c.ai_summary && (
                        <p className="line-clamp-2 text-muted-foreground">{c.ai_summary}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(c.created_at, ctx.company.region)}
                      </p>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-1">
          {writable ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("actions")}</CardTitle>
              </CardHeader>
              <CardContent>
                <LeadActions
                  leadId={lead.id}
                  status={lead.status}
                  assignedTo={lead.assigned_to}
                  team={team}
                />
              </CardContent>
            </Card>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("readOnlyAccess")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
