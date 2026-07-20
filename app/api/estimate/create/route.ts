import { getRouteContext } from "@/lib/auth/session";
import { canWrite } from "@/lib/auth/roles";
import { ok, err, unauthorized, forbidden, parseBody } from "@/lib/api/response";
import { createEstimateSchema } from "@/lib/validations/estimate";
import { computeTotals } from "@/lib/money";
import { nextDocumentNumber } from "@/lib/documents";
import { computeWinProbability } from "@/lib/estimates/winStats";

export const runtime = "nodejs";

/**
 * Persist a draft estimate. API twin of the `createEstimate` server action —
 * exists because the mobile app can't call server actions, and saving MUST run
 * server-side: totals are recomputed by computeTotals (client arithmetic is
 * never trusted, same rule as the LLM) and the document number is issued here.
 * Accepts the mobile Bearer JWT via getRouteContext(section, request).
 */
export async function POST(request: Request) {
  const auth = await getRouteContext("estimates", request);
  if ("error" in auth) {
    return auth.error === "unauthorized" ? unauthorized() : forbidden();
  }
  const { ctx, supabase } = auth;
  if (!canWrite(ctx.role)) return forbidden("Your role can't create estimates.");

  const { data: body, error } = await parseBody(request, createEstimateSchema);
  if (error) return error;

  const vatRate = ctx.company.vat_registered ? Number(ctx.company.vat_rate) : 0;
  const totals = computeTotals(body.line_items, vatRate);
  const estimateNumber = await nextDocumentNumber(
    supabase,
    "estimates",
    ctx.company.id
  );

  // Win probability (best-effort — never blocks saving the estimate).
  let winProbability: number | null = null;
  let winFactors: string[] = [];
  try {
    const wp = await computeWinProbability(
      supabase,
      ctx.company,
      totals.total_inc_vat
    );
    if (wp) {
      winProbability = wp.win_probability;
      winFactors = wp.factors;
    }
  } catch {
    // ignore — leave win probability unset
  }

  const { data, error: insertError } = await supabase
    .from("estimates")
    .insert({
      company_id: ctx.company.id,
      customer_id: body.customer_id,
      property_id: body.property_id ?? null,
      lead_id: body.lead_id ?? null,
      estimate_number: estimateNumber,
      job_title: body.job_title,
      trade_category: ctx.company.trade,
      job_description_raw: body.job_description_raw ?? null,
      summary_for_customer: body.summary_for_customer,
      line_items: totals.line_items,
      subtotal: totals.subtotal,
      vat_rate: vatRate,
      vat_amount: totals.vat_amount,
      total_inc_vat: totals.total_inc_vat,
      estimated_duration_hours: body.estimated_duration_hours ?? null,
      ai_confidence: body.ai_confidence ?? null,
      ai_flags: body.ai_flags ?? [],
      win_probability: winProbability,
      win_probability_factors: winFactors,
      photo_urls: body.photo_urls ?? [],
      status: "draft",
    })
    .select("id, estimate_number")
    .single();

  if (insertError || !data) return err("Could not save the estimate.", 500);

  return ok({ id: data.id, estimate_number: data.estimate_number });
}
