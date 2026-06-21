import { createClient } from "@/lib/supabase/server";
import { getRouteContext } from "@/lib/auth/session";
import { ok, err, unauthorized, forbidden, parseBody } from "@/lib/api/response";
import { getStripe } from "@/lib/stripe";
import { publicEnv, optionalServerEnv } from "@/lib/env";
import { planById } from "@/lib/plans";
import { z } from "zod";

export const runtime = "nodejs";

const bodySchema = z.object({ plan: z.enum(["starter", "growth", "pro"]) });

/** Create a Stripe Checkout Session for a subscription plan. Owner only. */
export async function POST(request: Request) {
  const auth = await getRouteContext("billing");
  if ("error" in auth) {
    return auth.error === "unauthorized" ? unauthorized() : forbidden();
  }
  const { ctx } = auth;
  if (ctx.role !== "owner") return forbidden("Only the owner can manage billing.");

  const { data: body, error } = await parseBody(request, bodySchema);
  if (error) return error;

  const plan = planById(body.plan);
  const priceEnv = plan?.stripePriceEnv;
  const priceId = priceEnv ? optionalServerEnv(priceEnv) : undefined;
  if (!priceId) {
    return err("This plan isn't available for online checkout yet.", 400);
  }

  const stripe = getStripe();
  const supabase = createClient();

  // Reuse or create the Stripe customer for this company.
  let customerId = ctx.company.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: ctx.company.email,
      name: ctx.company.business_name,
      metadata: { company_id: ctx.company.id },
    });
    customerId = customer.id;
    await supabase
      .from("companies")
      .update({ stripe_customer_id: customerId })
      .eq("id", ctx.company.id);
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${publicEnv.appUrl}/settings/billing?status=success`,
    cancel_url: `${publicEnv.appUrl}/settings/billing?status=cancelled`,
    metadata: { company_id: ctx.company.id, plan: body.plan },
    subscription_data: {
      metadata: { company_id: ctx.company.id, plan: body.plan },
    },
  });

  if (!session.url) return err("Could not start checkout.", 502);
  return ok({ url: session.url });
}
