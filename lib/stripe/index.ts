import Stripe from "stripe";

import { serverEnv } from "@/lib/env";

let stripe: Stripe | null = null;

/** Lazily-constructed Stripe client (uses the SDK's pinned API version). */
export function getStripe(): Stripe {
  if (!stripe) {
    stripe = new Stripe(serverEnv("STRIPE_SECRET_KEY"), {
      typescript: true,
      appInfo: { name: "FieldOS AI" },
    });
  }
  return stripe;
}

/** Platform fee on customer invoice payments processed through Connect (0.5%). */
export const PLATFORM_FEE_RATE = 0.005;

export function platformFeeMinorUnits(totalMajor: number): number {
  return Math.round(totalMajor * PLATFORM_FEE_RATE * 100);
}

export function toMinorUnits(amountMajor: number): number {
  return Math.round(amountMajor * 100);
}
