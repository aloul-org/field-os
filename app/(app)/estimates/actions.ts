"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireSection } from "@/lib/auth/session";
import { canWrite } from "@/lib/auth/roles";
import { publicEnv } from "@/lib/env";
import { computeTotals } from "@/lib/money";
import { nextDocumentNumber } from "@/lib/documents";
import { computeWinProbability } from "@/lib/estimates/winStats";
import { sendEmail } from "@/lib/messaging/email";
import {
  createEstimateSchema,
  type CreateEstimateInput,
} from "@/lib/validations/estimate";

type Result<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const WRITE_DENIED = "You don't have permission to make changes.";

export async function createEstimate(
  input: CreateEstimateInput
): Promise<Result<{ id: string }>> {
  const ctx = await requireSection("estimates");
  if (!canWrite(ctx.role)) return { ok: false, error: WRITE_DENIED };

  const parsed = createEstimateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid estimate." };
  }
  const d = parsed.data;

  const supabase = createClient();
  const vatRate = ctx.company.vat_registered ? Number(ctx.company.vat_rate) : 0;
  const totals = computeTotals(d.line_items, vatRate);
  const estimateNumber = await nextDocumentNumber(
    supabase,
    "estimates",
    ctx.company.id
  );

  // Win probability (best-effort — never blocks saving the estimate).
  let winProbability: number | null = null;
  let winFactors: string[] = [];
  try {
    const wp = await computeWinProbability(supabase, ctx.company, totals.total_inc_vat);
    if (wp) {
      winProbability = wp.win_probability;
      winFactors = wp.factors;
    }
  } catch {
    // ignore — leave win probability unset
  }

  const { data, error } = await supabase
    .from("estimates")
    .insert({
      company_id: ctx.company.id,
      customer_id: d.customer_id,
      property_id: d.property_id ?? null,
      lead_id: d.lead_id ?? null,
      estimate_number: estimateNumber,
      job_title: d.job_title,
      trade_category: ctx.company.trade,
      job_description_raw: d.job_description_raw ?? null,
      summary_for_customer: d.summary_for_customer,
      line_items: totals.line_items,
      subtotal: totals.subtotal,
      vat_rate: vatRate,
      vat_amount: totals.vat_amount,
      total_inc_vat: totals.total_inc_vat,
      estimated_duration_hours: d.estimated_duration_hours ?? null,
      ai_confidence: d.ai_confidence ?? null,
      ai_flags: d.ai_flags ?? [],
      win_probability: winProbability,
      win_probability_factors: winFactors,
      photo_urls: d.photo_urls ?? [],
      status: "draft",
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: "Could not save the estimate." };
  }

  revalidatePath("/estimates");
  return { ok: true, data: { id: data.id } };
}

export async function updateEstimate(
  id: string,
  input: CreateEstimateInput
): Promise<Result<{ id: string }>> {
  const ctx = await requireSection("estimates");
  if (!canWrite(ctx.role)) return { ok: false, error: WRITE_DENIED };

  const parsed = createEstimateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid estimate." };
  }
  const d = parsed.data;

  const supabase = createClient();

  // Only draft estimates can be edited — once sent/accepted they're locked.
  const { data: existing } = await supabase
    .from("estimates")
    .select("id, status")
    .eq("id", id)
    .eq("company_id", ctx.company.id)
    .maybeSingle();

  if (!existing) return { ok: false, error: "Estimate not found." };
  if (existing.status !== "draft") {
    return { ok: false, error: "Only draft estimates can be edited." };
  }

  const vatRate = ctx.company.vat_registered ? Number(ctx.company.vat_rate) : 0;
  const totals = computeTotals(d.line_items, vatRate);

  // Re-score win probability against the new total (best-effort).
  let winProbability: number | null = null;
  let winFactors: string[] = [];
  try {
    const wp = await computeWinProbability(supabase, ctx.company, totals.total_inc_vat);
    if (wp) {
      winProbability = wp.win_probability;
      winFactors = wp.factors;
    }
  } catch {
    // ignore — leave win probability unset
  }

  const { error } = await supabase
    .from("estimates")
    .update({
      customer_id: d.customer_id,
      property_id: d.property_id ?? null,
      job_title: d.job_title,
      job_description_raw: d.job_description_raw ?? null,
      summary_for_customer: d.summary_for_customer,
      line_items: totals.line_items,
      subtotal: totals.subtotal,
      vat_rate: vatRate,
      vat_amount: totals.vat_amount,
      total_inc_vat: totals.total_inc_vat,
      estimated_duration_hours: d.estimated_duration_hours ?? null,
      ai_confidence: d.ai_confidence ?? null,
      ai_flags: d.ai_flags ?? [],
      win_probability: winProbability,
      win_probability_factors: winFactors,
    })
    .eq("id", id)
    .eq("company_id", ctx.company.id);

  if (error) return { ok: false, error: "Could not save the estimate." };

  revalidatePath(`/estimates/${id}`);
  revalidatePath("/estimates");
  return { ok: true, data: { id } };
}

export async function sendEstimate(
  id: string
): Promise<Result<{ url: string; emailed: boolean }>> {
  const ctx = await requireSection("estimates");
  if (!canWrite(ctx.role)) return { ok: false, error: WRITE_DENIED };

  const supabase = createClient();
  const { data: estimate, error } = await supabase
    .from("estimates")
    .select("id, status, acceptance_token, job_title, total_inc_vat, customer_id, sent_at")
    .eq("id", id)
    .eq("company_id", ctx.company.id)
    .maybeSingle();

  if (error || !estimate) return { ok: false, error: "Estimate not found." };

  const { error: updateError } = await supabase
    .from("estimates")
    .update({
      status: "sent",
      sent_at: estimate.sent_at ?? new Date().toISOString(),
    })
    .eq("id", id)
    .eq("company_id", ctx.company.id);

  if (updateError) return { ok: false, error: "Could not send the estimate." };

  const url = `${publicEnv.appUrl}/quote/${estimate.acceptance_token}`;

  // Best-effort email to the customer (Resend); falls back to copy-the-link.
  let emailed = false;
  if (estimate.customer_id) {
    const { data: customer } = await supabase
      .from("customers")
      .select("email, name")
      .eq("id", estimate.customer_id)
      .maybeSingle();
    if (customer?.email) {
      const res = await sendEmail({
        to: customer.email,
        subject: `Your quote from ${ctx.company.business_name}`,
        html: `<p>Hi ${customer.name},</p><p>${ctx.company.business_name} has sent you a quote for "${estimate.job_title}".</p><p><a href="${url}">View and accept your quote</a></p>`,
      });
      emailed = res.ok;
    }
  }

  revalidatePath(`/estimates/${id}`);
  revalidatePath("/estimates");
  return { ok: true, data: { url, emailed } };
}

export async function deleteEstimate(id: string): Promise<Result> {
  const ctx = await requireSection("estimates");
  if (!canWrite(ctx.role)) return { ok: false, error: WRITE_DENIED };

  const supabase = createClient();
  const { error } = await supabase
    .from("estimates")
    .delete()
    .eq("id", id)
    .eq("company_id", ctx.company.id);

  if (error) return { ok: false, error: "Could not delete the estimate." };
  revalidatePath("/estimates");
  return { ok: true, data: undefined };
}
