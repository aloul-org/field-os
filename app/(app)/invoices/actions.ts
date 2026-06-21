"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireSection } from "@/lib/auth/session";
import { canWrite } from "@/lib/auth/roles";
import { publicEnv } from "@/lib/env";
import { computeTotals } from "@/lib/money";
import { nextDocumentNumber } from "@/lib/documents";
import { sendEmail } from "@/lib/messaging/email";
import { lineItemInputSchema } from "@/lib/validations/estimate";
import { z } from "zod";
import type { LineItem } from "@/lib/types/database";

type Result<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const WRITE_DENIED = "You don't have permission to make changes.";

function dueDate(termsDays: number | null): string {
  const d = new Date();
  d.setDate(d.getDate() + (termsDays ?? 14));
  return d.toISOString().slice(0, 10);
}

/** Create an invoice from a completed job (pulls items from the linked estimate). */
export async function createInvoiceFromJob(
  jobId: string
): Promise<Result<{ id: string }>> {
  const ctx = await requireSection("invoices");
  if (!canWrite(ctx.role)) return { ok: false, error: WRITE_DENIED };

  const supabase = createClient();

  const { data: existing } = await supabase
    .from("invoices")
    .select("id")
    .eq("job_id", jobId)
    .eq("company_id", ctx.company.id)
    .maybeSingle();
  if (existing) return { ok: true, data: { id: existing.id } };

  const { data: job } = await supabase
    .from("jobs")
    .select("id, customer_id, estimate_id")
    .eq("id", jobId)
    .eq("company_id", ctx.company.id)
    .maybeSingle();
  if (!job) return { ok: false, error: "Job not found." };

  let lineItems: LineItem[] = [];
  let vatRate = ctx.company.vat_registered ? Number(ctx.company.vat_rate) : 0;
  if (job.estimate_id) {
    const { data: estimate } = await supabase
      .from("estimates")
      .select("line_items, vat_rate")
      .eq("id", job.estimate_id)
      .maybeSingle();
    if (estimate) {
      lineItems = (estimate.line_items ?? []) as LineItem[];
      vatRate = Number(estimate.vat_rate);
    }
  }

  const created = await insertInvoice(supabase, {
    companyId: ctx.company.id,
    customerId: job.customer_id,
    jobId: job.id,
    estimateId: job.estimate_id,
    lineItems,
    vatRate,
    paymentTermsDays: ctx.company.payment_terms_days,
  });
  if (!created.ok) return created;

  await supabase
    .from("jobs")
    .update({ status: "invoiced" })
    .eq("id", jobId)
    .eq("company_id", ctx.company.id);

  revalidatePath("/invoices");
  revalidatePath(`/jobs/${jobId}`);
  return created;
}

/** Create an invoice directly from an accepted estimate. */
export async function createInvoiceFromEstimate(
  estimateId: string
): Promise<Result<{ id: string }>> {
  const ctx = await requireSection("invoices");
  if (!canWrite(ctx.role)) return { ok: false, error: WRITE_DENIED };

  const supabase = createClient();
  const { data: estimate } = await supabase
    .from("estimates")
    .select("id, customer_id, job_id, line_items, vat_rate")
    .eq("id", estimateId)
    .eq("company_id", ctx.company.id)
    .maybeSingle();
  if (!estimate) return { ok: false, error: "Estimate not found." };

  if (estimate.job_id) {
    const { data: existing } = await supabase
      .from("invoices")
      .select("id")
      .eq("job_id", estimate.job_id)
      .maybeSingle();
    if (existing) return { ok: true, data: { id: existing.id } };
  }

  const created = await insertInvoice(supabase, {
    companyId: ctx.company.id,
    customerId: estimate.customer_id,
    jobId: estimate.job_id,
    estimateId: estimate.id,
    lineItems: (estimate.line_items ?? []) as LineItem[],
    vatRate: Number(estimate.vat_rate),
    paymentTermsDays: ctx.company.payment_terms_days,
  });
  if (!created.ok) return created;

  if (estimate.job_id) {
    await supabase
      .from("jobs")
      .update({ status: "invoiced" })
      .eq("id", estimate.job_id)
      .eq("company_id", ctx.company.id);
  }

  revalidatePath("/invoices");
  return created;
}

async function insertInvoice(
  supabase: ReturnType<typeof createClient>,
  opts: {
    companyId: string;
    customerId: string | null;
    jobId: string | null;
    estimateId: string | null;
    lineItems: LineItem[];
    vatRate: number;
    paymentTermsDays: number | null;
  }
): Promise<Result<{ id: string }>> {
  const totals = computeTotals(opts.lineItems, opts.vatRate);
  const invoiceNumber = await nextDocumentNumber(
    supabase,
    "invoices",
    opts.companyId
  );
  const { data, error } = await supabase
    .from("invoices")
    .insert({
      company_id: opts.companyId,
      customer_id: opts.customerId,
      job_id: opts.jobId,
      estimate_id: opts.estimateId,
      invoice_number: invoiceNumber,
      line_items: totals.line_items,
      subtotal: totals.subtotal,
      vat_rate: opts.vatRate,
      vat_amount: totals.vat_amount,
      total_inc_vat: totals.total_inc_vat,
      status: "draft",
      due_date: dueDate(opts.paymentTermsDays),
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: "Could not create the invoice." };
  return { ok: true, data: { id: data.id } };
}

const updateLineItemsSchema = z.object({
  line_items: z.array(lineItemInputSchema).min(1),
});

/** Edit a draft invoice's line items (recomputes all money server-side). */
export async function updateInvoiceLineItems(
  id: string,
  lineItems: unknown
): Promise<Result> {
  const ctx = await requireSection("invoices");
  if (!canWrite(ctx.role)) return { ok: false, error: WRITE_DENIED };

  const parsed = updateLineItemsSchema.safeParse({ line_items: lineItems });
  if (!parsed.success) return { ok: false, error: "Add at least one line item." };

  const supabase = createClient();
  const { data: invoice } = await supabase
    .from("invoices")
    .select("vat_rate, status")
    .eq("id", id)
    .eq("company_id", ctx.company.id)
    .maybeSingle();
  if (!invoice) return { ok: false, error: "Invoice not found." };
  if (invoice.status === "paid") return { ok: false, error: "This invoice is already paid." };

  const totals = computeTotals(parsed.data.line_items, Number(invoice.vat_rate));
  const { error } = await supabase
    .from("invoices")
    .update({
      line_items: totals.line_items,
      subtotal: totals.subtotal,
      vat_amount: totals.vat_amount,
      total_inc_vat: totals.total_inc_vat,
    })
    .eq("id", id)
    .eq("company_id", ctx.company.id);
  if (error) return { ok: false, error: "Could not save the invoice." };

  revalidatePath(`/invoices/${id}`);
  return { ok: true, data: undefined };
}

export async function sendInvoice(
  id: string
): Promise<Result<{ url: string; emailed: boolean }>> {
  const ctx = await requireSection("invoices");
  if (!canWrite(ctx.role)) return { ok: false, error: WRITE_DENIED };

  const supabase = createClient();
  const { data: invoice } = await supabase
    .from("invoices")
    .select("id, public_token, invoice_number, total_inc_vat, customer_id, sent_at, status")
    .eq("id", id)
    .eq("company_id", ctx.company.id)
    .maybeSingle();
  if (!invoice) return { ok: false, error: "Invoice not found." };

  await supabase
    .from("invoices")
    .update({
      status: invoice.status === "draft" ? "sent" : invoice.status,
      sent_at: invoice.sent_at ?? new Date().toISOString(),
    })
    .eq("id", id)
    .eq("company_id", ctx.company.id);

  const url = `${publicEnv.appUrl}/invoice/${invoice.public_token}`;

  let emailed = false;
  if (invoice.customer_id) {
    const { data: customer } = await supabase
      .from("customers")
      .select("email, name")
      .eq("id", invoice.customer_id)
      .maybeSingle();
    if (customer?.email) {
      const res = await sendEmail({
        to: customer.email,
        subject: `Invoice ${invoice.invoice_number} from ${ctx.company.business_name}`,
        html: `<p>Hi ${customer.name},</p><p>Please find your invoice ${invoice.invoice_number}.</p><p><a href="${url}">View and pay your invoice</a></p>`,
      });
      emailed = res.ok;
    }
  }

  revalidatePath(`/invoices/${id}`);
  revalidatePath("/invoices");
  return { ok: true, data: { url, emailed } };
}

/** Manually mark an invoice paid (bank transfer / cash — no platform fee). */
export async function markInvoicePaid(id: string): Promise<Result> {
  const ctx = await requireSection("invoices");
  if (!canWrite(ctx.role)) return { ok: false, error: WRITE_DENIED };

  const supabase = createClient();
  const { error } = await supabase
    .from("invoices")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", id)
    .eq("company_id", ctx.company.id);
  if (error) return { ok: false, error: "Could not update the invoice." };

  revalidatePath(`/invoices/${id}`);
  revalidatePath("/invoices");
  return { ok: true, data: undefined };
}
