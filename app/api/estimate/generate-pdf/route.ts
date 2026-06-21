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
  const auth = await getRouteContext("estimates");
  if ("error" in auth) {
    return auth.error === "unauthorized" ? unauthorized() : forbidden();
  }
  const { ctx } = auth;

  const { data: body, error } = await parseBody(request, bodySchema);
  if (error) return error;

  const supabase = createClient();
  const { data: estimate } = await supabase
    .from("estimates")
    .select("*, customers(name)")
    .eq("id", body.id)
    .eq("company_id", ctx.company.id)
    .maybeSingle();
  if (!estimate) return notFound("Estimate not found.");

  const customer = estimate.customers as unknown as { name: string } | null;

  let buffer: Buffer;
  try {
    buffer = await generateDocumentPdf({
      variant: "estimate",
      documentNumber: estimate.estimate_number,
      date: estimate.created_at,
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
      jobTitle: estimate.job_title,
      summary: estimate.summary_for_customer,
      lineItems: (estimate.line_items ?? []) as LineItem[],
      subtotal: Number(estimate.subtotal),
      vatRate: Number(estimate.vat_rate),
      vatAmount: Number(estimate.vat_amount),
      total: Number(estimate.total_inc_vat),
    });
  } catch {
    return err("Could not generate the PDF on this server. See PDF setup notes.", 502);
  }

  const url = await uploadPdf(
    supabase,
    ctx.company.id,
    "estimates",
    `${estimate.estimate_number}.pdf`,
    buffer
  );
  if (!url) return err("Could not save the PDF.", 502);

  await supabase
    .from("estimates")
    .update({ pdf_url: url })
    .eq("id", estimate.id)
    .eq("company_id", ctx.company.id);

  return ok({ url });
}
