import type { SubscriptionPlan } from "@/lib/types/database";

export interface PlanTier {
  id: SubscriptionPlan;
  name: string;
  priceGBP: number | null;
  priceEUR: number | null;
  /** null price => "Custom" (Enterprise). */
  users: string;
  tagline: string;
  features: string[];
  recommended?: boolean;
  /** Which env var holds the Stripe price id (server-side checkout). */
  stripePriceEnv?:
    | "STRIPE_PRICE_ID_STARTER"
    | "STRIPE_PRICE_ID_GROWTH"
    | "STRIPE_PRICE_ID_PRO";
}

export const PLANS: PlanTier[] = [
  {
    id: "starter",
    name: "Starter",
    priceGBP: 79,
    priceEUR: 89,
    users: "1–3 users",
    tagline: "Everything a solo operator needs to look professional.",
    features: [
      "All core modules",
      "Manual scheduling",
      "AI estimating & invoicing",
      "AI Coach — 20 questions/month",
    ],
    stripePriceEnv: "STRIPE_PRICE_ID_STARTER",
  },
  {
    id: "growth",
    name: "Growth",
    priceGBP: 199,
    priceEUR: 229,
    users: "5–20 users",
    tagline: "For teams that dispatch and want the AI doing the heavy lifting.",
    features: [
      "Everything in Starter",
      "AI auto-scheduling & route optimisation",
      "Unlimited AI Coach",
      "Materials management",
    ],
    recommended: true,
    stripePriceEnv: "STRIPE_PRICE_ID_GROWTH",
  },
  {
    id: "pro",
    name: "Pro",
    priceGBP: 499,
    priceEUR: 569,
    users: "Unlimited users",
    tagline: "Full intelligence layer for multi-location operations.",
    features: [
      "Everything in Growth",
      "AI CFO",
      "Multi-location support",
      "Priority support",
    ],
    stripePriceEnv: "STRIPE_PRICE_ID_PRO",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    priceGBP: null,
    priceEUR: null,
    users: "Custom",
    tagline: "Custom integrations, SSO and dedicated onboarding.",
    features: [
      "Everything in Pro",
      "Custom integrations",
      "SSO",
      "Dedicated onboarding",
    ],
  },
];

export function planById(id: string): PlanTier | undefined {
  return PLANS.find((p) => p.id === id);
}

export function planPrice(plan: PlanTier, region: "UK" | "DE"): string {
  const value = region === "DE" ? plan.priceEUR : plan.priceGBP;
  if (value === null) return "Custom";
  const symbol = region === "DE" ? "€" : "£";
  return `${symbol}${value}`;
}

/**
 * Server-enforced module gating by plan (mirrors the pricing table). Used by API
 * routes via assertPlanAllows() — never rely on UI hiding alone.
 */
const PLAN_RANK: Record<SubscriptionPlan, number> = {
  starter: 0,
  growth: 1,
  pro: 2,
  enterprise: 3,
};

export type GatedFeature =
  | "ai_auto_schedule"
  | "route_optimisation"
  | "materials"
  | "unlimited_coach"
  | "ai_cfo"
  | "multi_location";

const FEATURE_MIN_PLAN: Record<GatedFeature, SubscriptionPlan> = {
  ai_auto_schedule: "growth",
  route_optimisation: "growth",
  materials: "growth",
  unlimited_coach: "growth",
  ai_cfo: "pro",
  multi_location: "pro",
};

export function planAllows(
  plan: SubscriptionPlan,
  feature: GatedFeature
): boolean {
  return PLAN_RANK[plan] >= PLAN_RANK[FEATURE_MIN_PLAN[feature]];
}
