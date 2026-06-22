"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireSection } from "@/lib/auth/session";
import { canWrite } from "@/lib/auth/roles";
import { suggestRenewal, addMonths } from "@/lib/renewals/eligibility";

type Result = { ok: true } | { ok: false; error: string };

/**
 * Create a renewal plan from a completed job (spec Module 10 upsell). Uses the
 * keyword eligibility rules to pick a sensible default plan type/interval.
 */
export async function createRenewalFromJob(jobId: string): Promise<Result> {
  const ctx = await requireSection("jobs");
  if (!canWrite(ctx.role)) {
    return { ok: false, error: "You don't have permission to make changes." };
  }

  const supabase = createClient();
  const { data: job } = await supabase
    .from("jobs")
    .select("id, customer_id, property_id, title, description, trade_category")
    .eq("id", jobId)
    .eq("company_id", ctx.company.id)
    .maybeSingle();
  if (!job || !job.customer_id) {
    return { ok: false, error: "This job has no customer to set a renewal for." };
  }

  const text = `${job.title} ${job.description ?? ""} ${job.trade_category}`;
  const suggestion = suggestRenewal(text) ?? {
    planType: "Maintenance plan",
    intervalMonths: 12,
  };
  const today = new Date().toISOString().slice(0, 10);

  const { error } = await supabase.from("renewal_plans").insert({
    company_id: ctx.company.id,
    customer_id: job.customer_id,
    property_id: job.property_id,
    plan_type: suggestion.planType,
    interval_months: suggestion.intervalMonths,
    next_due_date: addMonths(today, suggestion.intervalMonths),
    status: "active",
  });
  if (error) return { ok: false, error: "Could not set up the renewal." };

  revalidatePath(`/jobs/${jobId}`);
  return { ok: true };
}
