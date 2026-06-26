import { createClient } from "@/lib/supabase/server";
import { getRouteContext } from "@/lib/auth/session";
import { ok, unauthorized, forbidden } from "@/lib/api/response";
import { forecastRevenue, type MonthlyPoint } from "@/lib/finance/forecast";
import { runTextPrompt, MODELS } from "@/lib/ai/provider";

export const runtime = "nodejs";

/**
 * Revenue forecast (spec Module 9). The projection is computed with real math in
 * `lib/finance/forecast.ts`; Claude only narrates the result. Returns null-safe
 * data so the finance card can render even with little history.
 */
export async function POST() {
  const auth = await getRouteContext("finance");
  if ("error" in auth) {
    return auth.error === "unauthorized" ? unauthorized() : forbidden();
  }
  const ctx = auth.ctx;
  const supabase = createClient();

  // Monthly revenue from paid jobs over the last ~18 months.
  const since = new Date();
  since.setUTCMonth(since.getUTCMonth() - 18);
  const { data } = await supabase
    .from("job_profitability")
    .select("revenue, created_at")
    .eq("company_id", ctx.company.id)
    .gte("created_at", since.toISOString());

  const byMonth = new Map<string, number>();
  for (const r of data ?? []) {
    const key = r.created_at.slice(0, 7);
    byMonth.set(key, (byMonth.get(key) ?? 0) + Number(r.revenue));
  }
  const history: MonthlyPoint[] = Array.from(byMonth.entries()).map(
    ([month, revenue]) => ({ month, revenue: Math.round(revenue) })
  );

  const forecast = forecastRevenue(history);
  if (!forecast) {
    return ok({ forecast: null, narrative: "Not enough paid-invoice history yet to forecast." });
  }

  let narrative = forecast.momChangePct != null
    ? `Revenue is ${forecast.momChangePct >= 0 ? "up" : "down"} ${Math.abs(forecast.momChangePct)}% month over month.`
    : "Revenue history is building up.";

  try {
    narrative = await runTextPrompt({
      model: MODELS.background,
      system:
        "You write a one-to-two sentence plain-English revenue narrative for a trades business owner. Use ONLY the numbers given — never invent figures. Mention the trend and the projected next month. Be concise and concrete.",
      messages: [{ role: "user", content: JSON.stringify(forecast) }],
      maxTokens: 180,
    });
  } catch {
    // keep deterministic fallback
  }

  return ok({ forecast, narrative });
}
