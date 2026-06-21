import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { getRouteContext } from "@/lib/auth/session";
import { ok, err, unauthorized, forbidden, parseBody, notFound } from "@/lib/api/response";
import { generateDocumentPdf } from "@/lib/pdf/generatePdf";
import { uploadPdf } from "@/lib/pdf/upload";
import type { LineItem } from "@/lib/types/database";

export const runtime = "nodejs";
export const maxDuration = 60;

const bodySchema = z.object({ id: z.string().uuid() });

export async function POST(request: Request) {
  const auth = await getRouteContext("invoices");
  if ("error" in auth) {
    return auth.error === "unauthorized" ? unauthorized() : forbidden();
  }
  const { ctx } = auth;

  const { data: body, error } = await parseBody(request, bodySchema);
  if (error) return error;

  const supabase = createClient();
  const { data: invoice } = await supabase
    .from("invoices")
    .select("*, customers(name)")
    .eq("id", body.id)
    .eq("company_id", ctx.company.id)
    .maybeSingle();
  if (!invoice) return notFound("Invoice not found.");

  const customer = invoice.customers as unknown as { name: string } | null;

  let buffer: Buffer;
  try {
    buffer = await generateDocumentPdf({
      variant: "invoice",
      documentNumber: invoice.invoice_number,
      date: invoice.created_at,
      dueDate: invoice.due_date,
      company: {
        businessName: ctx.company.business_name,
        address: ctx.company.address,
        phone: ctx.company.phone,
        email: ctx.company.email,
        vatNumber: ctx.company.vat_number,
        logoUrl: ctx.company.logo_url,
        accentColour: ctx.company.accent_colour,
        region: ctx.company.region,
      },
      customerName: customer?.name ?? "Customer",
      lineItems: (invoice.line_items ?? []) as LineItem[],
      subtotal: Number(invoice.subtotal),
      vatRate: Number(invoice.vat_rate),
      vatAmount: Number(invoice.vat_amount),
      total: Number(invoice.total_inc_vat),
    });
  } catch {
    return err("Could not generate the PDF on this server. See PDF setup notes.", 502);
  }

  const url = await uploadPdf(
    supabase,
    ctx.company.id,
    "invoices",
    `${invoice.invoice_number}.pdf`,
    buffer
  );
  if (!url) return err("Could not save the PDF.", 502);

  await supabase
    .from("invoices")
    .update({ pdf_url: url })
    .eq("id", invoice.id)
    .eq("company_id", ctx.company.id);

  return ok({ url });
}
