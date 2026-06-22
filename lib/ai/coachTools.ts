import type Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/types/database";

/**
 * Safe, read-only, company-scoped data tools for the AI CFO + Business Coach
 * (spec Modules 9 & 12). The model picks tools; we run parameterised queries
 * server-side filtered to the caller's company — NO free-form SQL, no cross-tenant
 * access. Every number the model cites traces back to one of these results.
 */

function daysAgoISO(days: number): string {
  return new Date(Date.now() - days * 86400_000).toISOString();
}

type ToolFn = (
  supabase: SupabaseClient<Database>,
  companyId: string,
  args: Record<string, unknown>
) => Promise<unknown>;

interface ToolDef {
  spec: Anthropic.Tool;
  run: ToolFn;
  /** Financial tools are the only ones exposed to the CFO surface. */
  financial: boolean;
}

const TOOLS: Record<string, ToolDef> = {
  get_profit_trend: {
    financial: true,
    spec: {
      name: "get_profit_trend",
      description:
        "Monthly revenue and profit totals from paid jobs over the last N months. Use for profit/revenue trend questions.",
      input_schema: {
        type: "object",
        properties: { months: { type: "number", description: "How many months back (1-12)" } },
        required: ["months"],
      },
    },
    run: async (supabase, companyId, args) => {
      const months = Math.min(12, Math.max(1, Number(args.months) || 6));
      const { data } = await supabase
        .from("job_profitability")
        .select("revenue, profit, created_at")
        .eq("company_id", companyId)
        .gte("created_at", daysAgoISO(months * 31));
      const byMonth = new Map<string, { revenue: number; profit: number }>();
      for (const r of data ?? []) {
        const key = r.created_at.slice(0, 7);
        const m = byMonth.get(key) ?? { revenue: 0, profit: 0 };
        m.revenue += Number(r.revenue);
        m.profit += Number(r.profit ?? 0);
        byMonth.set(key, m);
      }
      return Array.from(byMonth.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, v]) => ({ month, revenue: Math.round(v.revenue), profit: Math.round(v.profit) }));
    },
  },

  get_revenue_by_category: {
    financial: true,
    spec: {
      name: "get_revenue_by_category",
      description: "Revenue and profit grouped by service/trade category over the last N days.",
      input_schema: {
        type: "object",
        properties: { period_days: { type: "number", description: "Lookback window in days" } },
        required: ["period_days"],
      },
    },
    run: async (supabase, companyId, args) => {
      const days = Math.min(365, Math.max(1, Number(args.period_days) || 90));
      const { data } = await supabase
        .from("job_profitability")
        .select("revenue, profit, jobs(trade_category)")
        .eq("company_id", companyId)
        .gte("created_at", daysAgoISO(days));
      const byCat = new Map<string, { revenue: number; profit: number; jobs: number }>();
      for (const r of data ?? []) {
        const job = r.jobs as unknown as { trade_category: string } | null;
        const key = job?.trade_category ?? "other";
        const c = byCat.get(key) ?? { revenue: 0, profit: 0, jobs: 0 };
        c.revenue += Number(r.revenue);
        c.profit += Number(r.profit ?? 0);
        c.jobs += 1;
        byCat.set(key, c);
      }
      return Array.from(byCat.entries()).map(([category, v]) => ({
        category,
        revenue: Math.round(v.revenue),
        profit: Math.round(v.profit),
        jobs: v.jobs,
      }));
    },
  },

  get_technician_profitability: {
    financial: true,
    spec: {
      name: "get_technician_profitability",
      description: "Revenue, profit and job count per technician over the last N days.",
      input_schema: {
        type: "object",
        properties: { period_days: { type: "number" } },
        required: ["period_days"],
      },
    },
    run: async (supabase, companyId, args) => {
      const days = Math.min(365, Math.max(1, Number(args.period_days) || 90));
      const [{ data: profit }, { data: members }] = await Promise.all([
        supabase
          .from("job_profitability")
          .select("technician_id, revenue, profit")
          .eq("company_id", companyId)
          .gte("created_at", daysAgoISO(days)),
        supabase.from("team_members").select("id, name").eq("company_id", companyId),
      ]);
      const name = new Map((members ?? []).map((m) => [m.id, m.name]));
      const byTech = new Map<string, { revenue: number; profit: number; jobs: number }>();
      for (const r of profit ?? []) {
        const key = r.technician_id ?? "unassigned";
        const t = byTech.get(key) ?? { revenue: 0, profit: 0, jobs: 0 };
        t.revenue += Number(r.revenue);
        t.profit += Number(r.profit ?? 0);
        t.jobs += 1;
        byTech.set(key, t);
      }
      return Array.from(byTech.entries()).map(([id, v]) => ({
        technician: id === "unassigned" ? "Unassigned" : name.get(id) ?? "Technician",
        revenue: Math.round(v.revenue),
        profit: Math.round(v.profit),
        jobs: v.jobs,
      }));
    },
  },

  get_quote_loss_reasons: {
    financial: true,
    spec: {
      name: "get_quote_loss_reasons",
      description:
        "Counts of rejected/expired estimates and lost leads (with reasons where recorded) over the last N days.",
      input_schema: {
        type: "object",
        properties: { period_days: { type: "number" } },
        required: ["period_days"],
      },
    },
    run: async (supabase, companyId, args) => {
      const days = Math.min(365, Math.max(1, Number(args.period_days) || 90));
      const since = daysAgoISO(days);
      const [{ data: estimates }, { data: leads }] = await Promise.all([
        supabase
          .from("estimates")
          .select("status")
          .eq("company_id", companyId)
          .in("status", ["rejected", "expired", "accepted", "sent"])
          .gte("created_at", since),
        supabase
          .from("leads")
          .select("status, score_reason")
          .eq("company_id", companyId)
          .eq("status", "lost")
          .gte("created_at", since),
      ]);
      const total = (estimates ?? []).length;
      const rejected = (estimates ?? []).filter((e) => e.status === "rejected").length;
      const expired = (estimates ?? []).filter((e) => e.status === "expired").length;
      const accepted = (estimates ?? []).filter((e) => e.status === "accepted").length;
      const lostLeadReasons = (leads ?? [])
        .map((l) => l.score_reason)
        .filter(Boolean)
        .slice(0, 20);
      return {
        estimates_considered: total,
        rejected,
        expired,
        accepted,
        win_rate_pct: total > 0 ? Math.round((accepted / total) * 100) : null,
        lost_lead_count: (leads ?? []).length,
        lost_lead_reasons: lostLeadReasons,
      };
    },
  },

  get_lead_conversion_funnel: {
    financial: false,
    spec: {
      name: "get_lead_conversion_funnel",
      description:
        "Lead counts by status (new/contacted/quoted/converted/lost) over the last N days — the conversion funnel.",
      input_schema: {
        type: "object",
        properties: { period_days: { type: "number" } },
        required: ["period_days"],
      },
    },
    run: async (supabase, companyId, args) => {
      const days = Math.min(365, Math.max(1, Number(args.period_days) || 90));
      const { data } = await supabase
        .from("leads")
        .select("status")
        .eq("company_id", companyId)
        .gte("created_at", daysAgoISO(days));
      const counts: Record<string, number> = {};
      for (const l of data ?? []) counts[l.status] = (counts[l.status] ?? 0) + 1;
      const total = (data ?? []).length;
      return {
        total,
        by_status: counts,
        conversion_rate_pct: total > 0 ? Math.round(((counts.converted ?? 0) / total) * 100) : null,
      };
    },
  },
};

/** Tool specs to advertise to the model for a given surface. */
export function toolSpecs(mode: "coach" | "cfo"): Anthropic.Tool[] {
  return Object.values(TOOLS)
    .filter((t) => (mode === "cfo" ? t.financial : true))
    .map((t) => t.spec);
}

/** Execute a tool by name, scoped to the company. Unknown tools return an error. */
export async function runTool(
  name: string,
  supabase: SupabaseClient<Database>,
  companyId: string,
  args: Record<string, unknown>
): Promise<unknown> {
  const tool = TOOLS[name];
  if (!tool) return { error: `Unknown tool: ${name}` };
  try {
    return await tool.run(supabase, companyId, args);
  } catch {
    return { error: "That data couldn't be loaded." };
  }
}
