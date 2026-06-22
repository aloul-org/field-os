import type Stripe from "stripe";

import { createAdminClient } from "@/lib/supabase/server";
import { recomputeJobProfitability } from "@/lib/finance/profitability";
import { getStripe } from "@/lib/stripe";
import { serverEnv } from "@/lib/env";
import type { SubscriptionPlan, SubscriptionStatus } from "@/lib/types/database";

export const runtime = "nodejs";

const PLANS: SubscriptionPlan[] = ["starter", "growth", "pro", "enterprise"];
function coercePlan(v: string | undefined): SubscriptionPlan | undefined {
  return v && PLANS.includes(v as SubscriptionPlan)
    ? (v as SubscriptionPlan)
    : undefined;
}

// Map Stripe subscription statuses to our enum.
function mapStatus(s: Stripe.Subscription.Status): SubscriptionStatus {
  switch (s) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
    case "incomplete_expired":
      return "canceled";
    default:
      return "incomplete";
  }
}

export async function POST(request: Request) {
  const stripe = getStripe();
  const signature = request.headers.get("stripe-signature");
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature ?? "",
      serverEnv("STRIPE_WEBHOOK_SECRET")
    );
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  const admin = createAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // Customer invoice payment (Connect/payment mode).
        const invoiceId = session.metadata?.invoice_id;
        if (invoiceId) {
          const fee = session.metadata?.platform_fee_minor
            ? Number(session.metadata.platform_fee_minor) / 100
            : null;
          const { data: paidInvoice } = await admin
            .from("invoices")
            .update({
              status: "paid",
              paid_at: new Date().toISOString(),
              stripe_payment_intent_id:
                typeof session.payment_intent === "string"
                  ? session.payment_intent
                  : null,
              platform_fee_amount: fee,
            })
            .eq("id", invoiceId)
            .select("company_id, job_id")
            .single();

          // Refresh the job profitability snapshot now revenue is realised.
          if (paidInvoice?.job_id && paidInvoice.company_id) {
            try {
              await recomputeJobProfitability(
                admin,
                paidInvoice.company_id,
                paidInvoice.job_id
              );
            } catch {
              // best-effort — analytics must never fail the payment webhook
            }
          }
          break;
        }

        // Subscription checkout.
        const companyId = session.metadata?.company_id;
        if (companyId && session.mode === "subscription") {
          await admin
            .from("companies")
            .update({
              subscription_status: "active",
              subscription_plan: coercePlan(session.metadata?.plan),
              stripe_subscription_id:
                typeof session.subscription === "string"
                  ? session.subscription
                  : null,
              stripe_customer_id:
                typeof session.customer === "string" ? session.customer : undefined,
            })
            .eq("id", companyId);
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const status =
          event.type === "customer.subscription.deleted"
            ? "canceled"
            : mapStatus(sub.status);
        const companyId = sub.metadata?.company_id;
        const query = admin
          .from("companies")
          .update({
            subscription_status: status,
            subscription_plan: coercePlan(sub.metadata?.plan),
            stripe_subscription_id: sub.id,
          });
        if (companyId) {
          await query.eq("id", companyId);
        } else if (typeof sub.customer === "string") {
          await query.eq("stripe_customer_id", sub.customer);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        if (typeof invoice.customer === "string") {
          await admin
            .from("companies")
            .update({ subscription_status: "past_due" })
            .eq("stripe_customer_id", invoice.customer);
        }
        break;
      }

      default:
        break;
    }
  } catch {
    // Don't fail the webhook for a downstream DB hiccup — Stripe will retry.
    return new Response("handler error", { status: 500 });
  }

  return new Response("ok", { status: 200 });
}
