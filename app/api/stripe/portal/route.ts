import { getRouteContext } from "@/lib/auth/session";
import { ok, err, unauthorized, forbidden } from "@/lib/api/response";
import { getStripe } from "@/lib/stripe";
import { publicEnv } from "@/lib/env";

export const runtime = "nodejs";

/** Open the Stripe billing portal for the company's subscription. Owner only. */
export async function POST() {
  const auth = await getRouteContext("billing");
  if ("error" in auth) {
    return auth.error === "unauthorized" ? unauthorized() : forbidden();
  }
  const { ctx } = auth;
  if (ctx.role !== "owner") return forbidden("Only the owner can manage billing.");
  if (!ctx.company.stripe_customer_id) {
    return err("No billing account yet — start a subscription first.", 400);
  }

  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: ctx.company.stripe_customer_id,
    return_url: `${publicEnv.appUrl}/settings/billing`,
  });

  return ok({ url: session.url });
}
