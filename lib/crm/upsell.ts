import type { Trade } from "@/lib/types/database";

export interface UpsellSuggestion {
  title: string;
  body: string;
}

/**
 * Rule-based upsell engine (Module 1). Intentionally NOT AI — fast, deterministic
 * rules decide *whether* to show a suggestion; Claude is only used elsewhere to
 * phrase customer-facing copy. Returns at most a couple of practical nudges.
 */
export function buildUpsellSuggestions(opts: {
  trade: Trade;
  hasActiveRenewalPlan: boolean;
  lastCompletedJobAt: string | null;
  jobCount: number;
}): UpsellSuggestion[] {
  const out: UpsellSuggestion[] = [];
  const { trade, hasActiveRenewalPlan, lastCompletedJobAt, jobCount } = opts;

  const monthsSinceLastJob = lastCompletedJobAt
    ? (Date.now() - new Date(lastCompletedJobAt).getTime()) /
      (1000 * 60 * 60 * 24 * 30)
    : null;

  const maintenanceTrades: Trade[] = [
    "hvac",
    "plumbing",
    "roofing",
    "pool_services",
    "pest_control",
  ];

  if (
    maintenanceTrades.includes(trade) &&
    !hasActiveRenewalPlan &&
    monthsSinceLastJob !== null &&
    monthsSinceLastJob >= 10
  ) {
    out.push({
      title: "Suggest an annual service plan",
      body: `It's been about ${Math.round(
        monthsSinceLastJob
      )} months since their last job and they have no maintenance plan — a great time to offer one.`,
    });
  }

  if (jobCount >= 3 && !hasActiveRenewalPlan) {
    out.push({
      title: "Loyal customer — offer a care plan",
      body: "They've used you several times. A recurring plan locks in repeat revenue.",
    });
  }

  return out.slice(0, 2);
}
