import { createClient } from "@/lib/supabase/server";
import { getRouteContext } from "@/lib/auth/session";
import { ok, unauthorized, forbidden } from "@/lib/api/response";
import { runTextPrompt, MODELS } from "@/lib/ai/provider";

export const runtime = "nodejs";

const WINDOW_DAYS = 30;

interface UsageEntry {
  material_id?: string;
  quantity?: number;
}

/**
 * Inventory forecast (spec Module 6). Consumption rate is computed in CODE
 * (sum recent usage ÷ window, project forward); Claude is used ONLY to write the
 * human-readable summary, never the arithmetic. Intended to run weekly via cron,
 * but also callable by the office on demand.
 */
export async function POST() {
  const auth = await getRouteContext("materials");
  if ("error" in auth) {
    return auth.error === "unauthorized" ? unauthorized() : forbidden();
  }
  const ctx = auth.ctx;
  const supabase = createClient();

  const since = new Date(Date.now() - WINDOW_DAYS * 86400_000).toISOString();

  const [{ data: materials }, { data: reports }] = await Promise.all([
    supabase
      .from("materials")
      .select("id, name, quantity_on_hand, reorder_threshold")
      .eq("company_id", ctx.company.id),
    supabase
      .from("job_reports")
      .select("materials_used, created_at, jobs!inner(company_id)")
      .gte("created_at", since),
  ]);

  if (!materials || materials.length === 0) {
    return ok({ forecast: [], summary: "No materials are being tracked yet." });
  }

  // Sum usage per material_id over the window.
  const usage = new Map<string, number>();
  for (const r of reports ?? []) {
    const job = r.jobs as unknown as { company_id: string } | null;
    if (job?.company_id !== ctx.company.id) continue;
    const entries = (r.materials_used as unknown as UsageEntry[]) ?? [];
    for (const e of entries) {
      if (!e?.material_id || typeof e.quantity !== "number") continue;
      usage.set(e.material_id, (usage.get(e.material_id) ?? 0) + e.quantity);
    }
  }

  const forecast = materials
    .map((m) => {
      const used = usage.get(m.id) ?? 0;
      const dailyRate = used / WINDOW_DAYS;
      const daysUntilEmpty = dailyRate > 0 ? Math.floor(m.quantity_on_hand / dailyRate) : null;
      const projected30 = Math.max(0, m.quantity_on_hand - dailyRate * 30);
      return {
        id: m.id,
        name: m.name,
        on_hand: m.quantity_on_hand,
        reorder_threshold: m.reorder_threshold,
        used_last_30d: Math.round(used * 10) / 10,
        days_until_empty: daysUntilEmpty,
        projected_in_30d: Math.round(projected30 * 10) / 10,
        at_risk: projected30 <= m.reorder_threshold && dailyRate > 0,
      };
    })
    .sort((a, b) => (a.days_until_empty ?? Infinity) - (b.days_until_empty ?? Infinity));

  const atRisk = forecast.filter((f) => f.at_risk);

  let summary = atRisk.length
    ? `${atRisk.length} material(s) are projected to fall below their reorder point within 30 days.`
    : "Stock levels look healthy for the next 30 days.";

  try {
    summary = await runTextPrompt({
      model: MODELS.background,
      system:
        "You write a short, plain-English inventory summary for a trades business owner. Be concise (under 80 words), highlight what needs reordering soon and roughly when. Do not invent numbers — use only the data given.",
      messages: [{ role: "user", content: JSON.stringify({ forecast }) }],
      maxTokens: 250,
    });
  } catch {
    // keep the deterministic fallback summary
  }

  return ok({ forecast, summary });
}
