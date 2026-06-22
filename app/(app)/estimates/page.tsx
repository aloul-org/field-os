import Link from "next/link";
import { FileText, Plus } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { requireSection } from "@/lib/auth/session";
import { canWrite } from "@/lib/auth/roles";
import { formatCurrency, formatDate } from "@/lib/format";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { JobTicketCard } from "@/components/shared/JobTicketCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { EstimateStatus } from "@/lib/types/database";

export const metadata = { title: "Estimates" };

const STATUS_VARIANT: Record<EstimateStatus, "secondary" | "default" | "success" | "destructive" | "warning"> = {
  draft: "secondary",
  sent: "default",
  accepted: "success",
  rejected: "destructive",
  expired: "warning",
};

export default async function EstimatesPage() {
  const ctx = await requireSection("estimates");
  const supabase = createClient();
  const region = ctx.company.region;
  const writable = canWrite(ctx.role);

  const { data: estimates } = await supabase
    .from("estimates")
    .select("id, estimate_number, job_title, status, total_inc_vat, win_probability, created_at, customers(name)")
    .eq("company_id", ctx.company.id)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div>
      <PageHeader
        title="Estimates"
        action={
          writable ? (
            <Button asChild>
              <Link href="/estimates/new">
                <Plus className="h-4 w-4" /> New estimate
              </Link>
            </Button>
          ) : null
        }
      />

      {!estimates || estimates.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No estimates yet"
          description="Create your first AI-drafted quote — by voice, text or a photo of the job."
          action={
            writable ? (
              <Button asChild>
                <Link href="/estimates/new">Create an estimate</Link>
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="space-y-3">
          {estimates.map((e) => {
            const customer = e.customers as unknown as { name: string } | null;
            return (
              <JobTicketCard
                key={e.id}
                href={`/estimates/${e.id}`}
                className="flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{e.job_title}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    <span className="font-mono">{e.estimate_number}</span> ·{" "}
                    {customer?.name ?? "—"} · {formatDate(e.created_at, region)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {e.win_probability != null && (
                    <span className="hidden text-xs text-muted-foreground sm:block">
                      {e.win_probability}% win
                    </span>
                  )}
                  <span className="hidden font-display font-medium sm:block">
                    {formatCurrency(Number(e.total_inc_vat), region)}
                  </span>
                  <Badge variant={STATUS_VARIANT[e.status]} className="capitalize">
                    {e.status}
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
