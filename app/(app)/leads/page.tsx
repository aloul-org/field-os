import Link from "next/link";
import { Inbox, Plus } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { requireSection } from "@/lib/auth/session";
import { canWrite } from "@/lib/auth/roles";
import { formatRelative } from "@/lib/format";
import { LEAD_STATUS_META, LEAD_STATUS_TABS, LEAD_SOURCE_LABEL } from "@/lib/leads/status";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { JobTicketCard } from "@/components/shared/JobTicketCard";
import { NewLeadDialog } from "@/components/leads/NewLeadDialog";
import { LeadScoreBadge } from "@/components/leads/LeadScoreBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { LeadStatus } from "@/lib/types/database";

export const metadata = { title: "Leads" };

const VALID_TABS = new Set(LEAD_STATUS_TABS.map((t) => t.key));

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const ctx = await requireSection("leads");
  const supabase = createClient();
  const writable = canWrite(ctx.role);

  const activeTab =
    searchParams.status && VALID_TABS.has(searchParams.status as LeadStatus)
      ? (searchParams.status as LeadStatus | "all")
      : "all";

  let query = supabase
    .from("leads")
    .select(
      "id, contact_name, contact_phone, job_description, raw_message, source, score, score_reason, status, created_at"
    )
    .eq("company_id", ctx.company.id);

  if (activeTab !== "all") query = query.eq("status", activeTab);
  // Spam is hidden from the default "all" view.
  if (activeTab === "all") query = query.neq("status", "spam");

  const { data: leads } = await query
    .order("created_at", { ascending: false })
    .limit(200);

  const newButton = writable ? (
    <NewLeadDialog
      trigger={
        <Button>
          <Plus className="h-4 w-4" /> Add lead
        </Button>
      }
    />
  ) : null;

  return (
    <div>
      <PageHeader
        title="Leads"
        description="Enquiries from calls, WhatsApp, your website and manual entry — scored automatically."
        action={newButton}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {LEAD_STATUS_TABS.map((tab) => {
          const href = tab.key === "all" ? "/leads" : `/leads?status=${tab.key}`;
          const active = activeTab === tab.key;
          return (
            <Link
              key={tab.key}
              href={href}
              className={cn(
                "rounded-pill px-3 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {!leads || leads.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No leads here yet"
          description="Leads from calls, WhatsApp, and your website will show up here. You can also add one by hand."
          action={newButton}
        />
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => {
            const summary =
              lead.job_description || lead.raw_message || "No details yet";
            const status = LEAD_STATUS_META[lead.status];
            return (
              <JobTicketCard key={lead.id} href={`/leads/${lead.id}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium">
                        {lead.contact_name ?? "New enquiry"}
                      </p>
                      <LeadScoreBadge score={lead.score} />
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {summary}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {LEAD_SOURCE_LABEL[lead.source]} ·{" "}
                      {formatRelative(lead.created_at, ctx.company.language)}
                    </p>
                  </div>
                  <Badge variant={status.variant} className="shrink-0">
                    {status.label}
                  </Badge>
                </div>
              </JobTicketCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
