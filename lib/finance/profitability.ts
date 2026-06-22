import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/types/database";

interface MaterialUsage {
  material_id?: string;
  quantity?: number;
  unit_cost?: number;
  cost?: number;
}

/** Hours between two ISO timestamps, or null if either is missing/invalid. */
function hoursBetween(start: string | null, end: string | null): number | null {
  if (!start || !end) return null;
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (Number.isNaN(ms) || ms <= 0) return null;
  return ms / 3_600_000;
}

/**
 * Recompute and store the profitability snapshot for one job (spec Module 9).
 * Called whenever the job's invoice is marked paid (manual or Stripe webhook).
 *
 *   revenue  = invoice.total_inc_vat
 *   labour   = Σ (technician hours × their hourly_rate)
 *   material = Σ job_reports.materials_used costs
 *   overhead = monthly_overhead ÷ jobs completed this month (even split, v1)
 *   profit   = revenue − labour − material − overhead
 *
 * Works with the RLS client (office action) or the admin client (Stripe webhook).
 */
export async function recomputeJobProfitability(
  supabase: SupabaseClient<Database>,
  companyId: string,
  jobId: string
): Promise<void> {
  const { data: invoice } = await supabase
    .from("invoices")
    .select("total_inc_vat")
    .eq("job_id", jobId)
    .eq("company_id", companyId)
    .maybeSingle();
  if (!invoice) return;
  const revenue = Number(invoice.total_inc_vat);

  // Labour: each appointment's hours (actual, else scheduled) × tech hourly_rate.
  const { data: appts } = await supabase
    .from("appointments")
    .select(
      "assigned_technician_id, scheduled_start, scheduled_end, actual_start, actual_end, team_members(hourly_rate)"
    )
    .eq("job_id", jobId)
    .eq("company_id", companyId);

  let labourCost = 0;
  let primaryTech: string | null = null;
  for (const a of appts ?? []) {
    if (!primaryTech && a.assigned_technician_id) primaryTech = a.assigned_technician_id;
    const member = a.team_members as unknown as { hourly_rate: number | null } | null;
    const rate = member?.hourly_rate ? Number(member.hourly_rate) : 0;
    const hours =
      hoursBetween(a.actual_start, a.actual_end) ??
      hoursBetween(a.scheduled_start, a.scheduled_end) ??
      0;
    labourCost += hours * rate;
  }

  // Materials: from the job report's materials_used, costed via unit_cost.
  const { data: report } = await supabase
    .from("job_reports")
    .select("materials_used")
    .eq("job_id", jobId)
    .maybeSingle();

  let materialCost = 0;
  const usage = (report?.materials_used as unknown as MaterialUsage[]) ?? [];
  const idsToPrice = usage
    .filter((u) => u.material_id && u.unit_cost == null && u.cost == null)
    .map((u) => u.material_id as string);
  const priceById = new Map<string, number>();
  if (idsToPrice.length > 0) {
    const { data: mats } = await supabase
      .from("materials")
      .select("id, unit_cost")
      .in("id", idsToPrice);
    for (const m of mats ?? []) priceById.set(m.id, Number(m.unit_cost ?? 0));
  }
  for (const u of usage) {
    if (typeof u.cost === "number") materialCost += u.cost;
    else {
      const qty = typeof u.quantity === "number" ? u.quantity : 0;
      const unit =
        typeof u.unit_cost === "number"
          ? u.unit_cost
          : u.material_id
            ? priceById.get(u.material_id) ?? 0
            : 0;
      materialCost += qty * unit;
    }
  }

  // Overhead: even split of monthly overhead across this month's completed jobs.
  const { data: company } = await supabase
    .from("companies")
    .select("monthly_overhead")
    .eq("id", companyId)
    .maybeSingle();
  const monthlyOverhead = company?.monthly_overhead ? Number(company.monthly_overhead) : 0;

  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  const { count: completedThisMonth } = await supabase
    .from("jobs")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId)
    .in("status", ["completed", "invoiced"])
    .gte("updated_at", monthStart.toISOString());
  const overheadAllocated =
    monthlyOverhead > 0 && (completedThisMonth ?? 0) > 0
      ? monthlyOverhead / (completedThisMonth as number)
      : 0;

  const profit = revenue - labourCost - materialCost - overheadAllocated;
  const marginPct = revenue > 0 ? (profit / revenue) * 100 : 0;

  const round = (n: number) => Math.round(n * 100) / 100;

  // Replace any prior snapshot for this job.
  await supabase.from("job_profitability").delete().eq("job_id", jobId).eq("company_id", companyId);
  await supabase.from("job_profitability").insert({
    company_id: companyId,
    job_id: jobId,
    technician_id: primaryTech,
    revenue: round(revenue),
    labour_cost: round(labourCost),
    material_cost: round(materialCost),
    overhead_allocated: round(overheadAllocated),
    profit: round(profit),
    margin_pct: round(marginPct),
  });
}
