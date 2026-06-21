import { z } from "zod";
import type Stripe from "stripe";

import { createAdminClient } from "@/lib/supabase/server";
import { ok, err, notFound } from "@/lib/api/response";
import { getStripe, toMinorUnits, platformFeeMinorUnits } from "@/lib/stripe";
import { publicEnv } from "@/lib/env";

export const runtime = "nodejs";

const tokenSchema = z.string().uuid();

/**
 * Public (no-login) Checkout Session for paying an invoice. When the company has
 * connected Stripe (Connect), the charge is routed to their account with the
 * platform's 0.5% application fee; otherwise it's a plain platform charge. The
 * webhook (checkout.session.completed) marks the invoice paid.
 */
export async function POST(
  _request: Request,
  { params }: { params: { token: string } }
) {
  if (!tokenSchema.safeParse(params.token).success) {
    return err("Invalid link", 400);
  }

  const admin = createAdminClient();
  const { data: invoice } = await admin
    .from("invoices")
    .select("id, invoice_number, total_inc_vat, status, company_id, public_token")
    .eq("public_token", params.token)
    .maybeSingle();

  if (!invoice) return notFound("Invoice not found.");
  if (invoice.status === "paid") {
    return err("This invoice has already been paid.", 409);
  }

  const { data: company } = await admin
    .from("companies")
    .select("business_name, region, stripe_connect_account_id")
    .eq("id", invoice.company_id)
    .maybeSingle();
  if (!company) return notFound("Company not found.");

  const currency = company.region === "DE" ? "eur" : "gbp";
  const amount = toMinorUnits(Number(invoice.total_inc_vat));
  const returnUrl = `${publicEnv.appUrl}/invoice/${invoice.public_token}`;

  let stripe: Stripe;
  try {
    stripe = getStripe();
  } catch {
    return err("Online payment isn't set up yet — please pay by bank transfer.", 503);
  }

  const feeMinor = platformFeeMinorUnits(Number(invoice.total_inc_vat));
  const paymentIntentData: Stripe.Checkout.SessionCreateParams.PaymentIntentData | undefined =
    company.stripe_connect_account_id
      ? {
          application_fee_amount: feeMinor,
          transfer_data: { destination: company.stripe_connect_account_id },
        }
      : undefined;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency,
            unit_amount: amount,
            product_data: {
              name: `${company.business_name} — Invoice ${invoice.invoice_number}`,
            },
          },
        },
      ],
      payment_intent_data: paymentIntentData,
      success_url: `${returnUrl}?status=paid`,
      cancel_url: returnUrl,
      metadata: {
        invoice_id: invoice.id,
        platform_fee_minor: String(feeMinor),
      },
    });
    if (!session.url) return err("Could not start payment.", 502);
    return ok({ url: session.url });
  } catch {
    return err("Could not start payment. Please try again.", 502);
  }
}
