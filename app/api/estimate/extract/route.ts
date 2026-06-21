import { createClient } from "@/lib/supabase/server";
import { getRouteContext } from "@/lib/auth/session";
import { ok, err, unauthorized, forbidden, parseBody } from "@/lib/api/response";
import { extractRequestSchema } from "@/lib/validations/estimate";
import { extractEstimate, type PricingAnchor } from "@/lib/ai/estimateEngine";
import { computeTotals } from "@/lib/money";

// AI extraction can exceed the default serverless timeout; run on Node.
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const auth = await getRouteContext("estimates");
  if ("error" in auth) {
    return auth.error === "unauthorized" ? unauthorized() : forbidden();
  }
  const { ctx } = auth;

  const { data: body, error } = await parseBody(request, extractRequestSchema);
  if (error) return error;

  const supabase = createClient();

  // Historical Estimate Engine: inject the 5 most recent accepted estimates in
  // the same trade_category as pricing anchors.
  const { data: anchorRows } = await supabase
    .from("estimates")
    .select("job_title, summary_for_customer, total_inc_vat")
    .eq("company_id", ctx.company.id)
    .eq("status", "accepted")
    .eq("trade_category", ctx.company.trade)
    .order("accepted_at", { ascending: false })
    .limit(5);

  const anchors: PricingAnchor[] = (anchorRows ?? []).map((a) => ({
    job_title: a.job_title,
    total_inc_vat: Number(a.total_inc_vat),
    summary: a.summary_for_customer,
  }));

  try {
    const ai = await extractEstimate({
      description: body.description ?? "",
      trade: ctx.company.trade,
      region: ctx.company.region,
      language: ctx.company.language,
      defaultHourlyRate: ctx.company.default_hourly_rate,
      defaultCallOutFee: ctx.company.default_call_out_fee,
      anchors,
      images: body.images,
    });

    // Recompute every money value server-side; VAT only if registered.
    const vatRate = ctx.company.vat_registered ? Number(ctx.company.vat_rate) : 0;
    const totals = computeTotals(ai.line_items, vatRate);

    return ok({
      job_title: ai.job_title,
      summary_for_customer: ai.summary_for_customer,
      estimated_duration_hours: ai.estimated_duration_hours ?? null,
      ai_confidence: ai.confidence,
      ai_flags: ai.flags,
      line_items: totals.line_items,
      subtotal: totals.subtotal,
      vat_rate: vatRate,
      vat_amount: totals.vat_amount,
      total_inc_vat: totals.total_inc_vat,
    });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Could not generate the estimate.";
    return err(message, 502);
  }
}
