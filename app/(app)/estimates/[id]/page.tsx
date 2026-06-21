import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireSection } from "@/lib/auth/session";
import { canWrite } from "@/lib/auth/roles";
import { publicEnv } from "@/lib/env";
import { formatCurrency, formatDate } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WinProbabilityBadge } from "@/components/estimate/WinProbabilityBadge";
import { ConfidenceBanner } from "@/components/estimate/ConfidenceBanner";
import { EstimateActions } from "@/components/estimate/EstimateActions";
import { DownloadPdfButton } from "@/components/shared/DownloadPdfButton";
import type { EstimateStatus, LineItem } from "@/lib/types/database";

const STATUS_VARIANT: Record<EstimateStatus, "secondary" | "default" | "success" | "destructive" | "warning"> = {
  draft: "secondary",
  sent: "default",
  accepted: "success",
  rejected: "destructive",
  expired: "warning",
};

export default async function EstimateDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const ctx = await requireSection("estimates");
  const supabase = createClient();
  const region = ctx.company.region;

  const { data: estimate } = await supabase
    .from("estimates")
    .select("*, customers(id, name)")
    .eq("id", params.id)
    .eq("company_id", ctx.company.id)
    .maybeSingle();

  if (!estimate) notFound();

  const customer = estimate.customers as unknown as { id: string; name: string } | null;
  const lineItems = (estimate.line_items ?? []) as LineItem[];
  const flags = (estimate.ai_flags ?? []) as string[];
  const winFactors = (estimate.win_probability_factors ?? []) as string[];
  const publicUrl = `${publicEnv.appUrl}/quote/${estimate.acceptance_token}`;
  const writable = canWrite(ctx.role);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {estimate.job_title}
            </h1>
            <Badge variant={STATUS_VARIANT[estimate.status]} className="capitalize">
              {estimate.status}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {estimate.estimate_number}
            {customer && (
              <>
                {" · "}
                <Link href={`/customers/${customer.id}`} className="hover:text-foreground">
                  {customer.name}
                </Link>
              </>
            )}
            {" · "}
            {formatDate(estimate.created_at, region)}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {estimate.summary_for_customer}
              </p>
              <ConfidenceBanner confidence={estimate.ai_confidence} flags={flags} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Line items</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                    <th className="pb-2 font-medium">Description</th>
                    <th className="pb-2 text-right font-medium">Qty</th>
                    <th className="pb-2 text-right font-medium">Unit</th>
                    <th className="pb-2 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((li, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2">{li.description}</td>
                      <td className="py-2 text-right">{li.quantity}</td>
                      <td className="py-2 text-right">
                        {formatCurrency(li.unit_price, region)}
                      </td>
                      <td className="py-2 text-right">
                        {formatCurrency(li.line_total, region)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="ml-auto mt-4 max-w-xs space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(Number(estimate.subtotal), region)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    VAT ({(Number(estimate.vat_rate) * 100).toFixed(0)}%)
                  </span>
                  <span>{formatCurrency(Number(estimate.vat_amount), region)}</span>
                </div>
                <div className="flex justify-between border-t pt-1 text-base font-semibold">
                  <span>Total</span>
                  <span>{formatCurrency(Number(estimate.total_inc_vat), region)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <EstimateActions
                id={estimate.id}
                status={estimate.status}
                publicUrl={publicUrl}
                jobId={estimate.job_id}
                canWrite={writable}
              />
              <div className="mt-4">
                <DownloadPdfButton
                  endpoint="/api/estimate/generate-pdf"
                  id={estimate.id}
                  existingUrl={estimate.pdf_url}
                />
              </div>
            </CardContent>
          </Card>

          {estimate.win_probability != null && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Win probability</CardTitle>
              </CardHeader>
              <CardContent>
                <WinProbabilityBadge
                  probability={estimate.win_probability}
                  factors={winFactors}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
