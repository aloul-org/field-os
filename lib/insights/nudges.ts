import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/types/database";

/**
 * Notable-insight detection for dynamic coach chips (spec Module 12). Runs a few
 * cheap, code-only checks against the company's data and returns a suggested
 * question ONLY when something is actually worth asking about that week — so a
 * chip like "Why did your win rate drop?" appears only if it really dropped.
 */
export interface Nudge {
  type: string;
  question: string;
}

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 86400_000).toISOString();
}

export async function computeNudges(
  supabase: SupabaseClient<Database>,
  companyId: string
): Promise<Nudge[]> {
  const nudges: Nudge[] = [];

  const [estimates, leads, invoices, profitability] = await Promise.all([
    supabase
      .from("estimates")
      .select("status, created_at")
      .eq("company_id", companyId)
      .gte("created_at", isoDaysAgo(60)),
    supabase
      .from("leads")
      .select("status, created_at")
      .eq("company_id", companyId)
      .gte("created_at", isoDaysAgo(30)),
    supabase
      .from("invoices")
      .select("status, due_date")
      .eq("company_id", companyId)
      .in("status", ["sent", "overdue"]),
    supabase
      .from("job_profitability")
      .select("margin_pct")
      .eq("company_id", companyId)
      .gte("created_at", isoDaysAgo(60)),
  ]);

  // 1) Win-rate drop: last 30d vs the prior 30d.
  const est = estimates.data ?? [];
  const decided = (rows: typeof est) => rows.filter((e) => ["accepted", "rejected", "expired"].includes(e.status));
  const winRate = (rows: typeof est) => {
    const d = decided(rows);
    return d.length ? d.filter((e) => e.status === "accepted").length / d.length : null;
  };
  const recentEst = est.filter((e) => e.created_at >= isoDaysAgo(30));
  const priorEst = est.filter((e) => e.created_at < isoDaysAgo(30));
  const recentWin = winRate(recentEst);
  const priorWin = winRate(priorEst);
  if (recentWin != null && priorWin != null && recentWin < priorWin - 0.1) {
    nudges.push({ type: "win_rate_drop", question: "Why did our win rate drop recently?" });
  }

  // 2) Low lead conversion this month.
  const ld = leads.data ?? [];
  if (ld.length >= 5) {
    const converted = ld.filter((l) => l.status === "converted").length;
    if (converted / ld.length < 0.2) {
      nudges.push({ type: "low_conversion", question: "How can we convert more of our leads?" });
    }
  }

  // 3) Overdue invoices outstanding.
  const today = new Date().toISOString().slice(0, 10);
  const overdue = (invoices.data ?? []).filter(
    (i) => i.status === "overdue" || (i.due_date && i.due_date < today)
  );
  if (overdue.length > 0) {
    nudges.push({ type: "overdue", question: "Which invoices are overdue and how much is outstanding?" });
  }

  // 4) Thin margins on recent jobs.
  const margins = (profitability.data ?? []).map((p) => Number(p.margin_pct ?? 0));
  if (margins.length >= 3) {
    const lowCount = margins.filter((m) => m < 10).length;
    if (lowCount / margins.length > 0.3) {
      nudges.push({ type: "low_margin", question: "Why are some of our jobs low margin?" });
    }
  }

  return nudges;
}
