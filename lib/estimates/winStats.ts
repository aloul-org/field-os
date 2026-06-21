import type { SupabaseClient } from "@supabase/supabase-js";

import type { CompanyRow, Database } from "@/lib/types/database";
import { scoreWinProbability, type WinProbability } from "@/lib/ai/estimateEngine";

/**
 * Compute real win-probability statistics in code (win rate over the last 90
 * days, the price's percentile vs recent accepted totals) and hand them to the
 * model to narrate. Returns null when there's no accepted history to anchor on —
 * we never let the model invent a base rate. Best-effort: callers treat a thrown
 * error as "no score".
 */
export async function computeWinProbability(
  supabase: SupabaseClient<Database>,
  company: CompanyRow,
  price: number
): Promise<WinProbability | null> {
  const trade = company.trade;
  const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000).toISOString();

  const [{ data: recent }, { data: accepted }] = await Promise.all([
    supabase
      .from("estimates")
      .select("status")
      .eq("company_id", company.id)
      .eq("trade_category", trade)
      .in("status", ["accepted", "rejected"])
      .gte("updated_at", ninetyDaysAgo),
    supabase
      .from("estimates")
      .select("total_inc_vat")
      .eq("company_id", company.id)
      .eq("trade_category", trade)
      .eq("status", "accepted")
      .order("accepted_at", { ascending: false })
      .limit(50),
  ]);

  const acceptedTotals = (accepted ?? []).map((e) => Number(e.total_inc_vat));
  if (acceptedTotals.length === 0) return null;

  const wins = (recent ?? []).filter((e) => e.status === "accepted").length;
  const decided = (recent ?? []).length;
  const winRatePct = decided > 0 ? (wins / decided) * 100 : 50;

  const cheaperOrEqual = acceptedTotals.filter((t) => t <= price).length;
  const pricePercentile = (cheaperOrEqual / acceptedTotals.length) * 100;
  const recentAverage =
    acceptedTotals.reduce((s, t) => s + t, 0) / acceptedTotals.length;

  return scoreWinProbability({
    price,
    trade,
    region: company.region,
    winRatePct,
    pricePercentile,
    recentAverage,
    sampleSize: Math.max(decided, acceptedTotals.length),
  });
}
