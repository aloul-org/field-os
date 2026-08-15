import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  Database,
  SubscriptionPlan,
  SubscriptionStatus,
} from "@/lib/types/database";
import { planById } from "@/lib/plans";

type Client = SupabaseClient<Database>;

export interface PlatformReports {
  mrrGBP: number;
  mrrEUR: number;
  activeCount: number;
  trialingCount: number;
  totalCount: number;
  planBreakdown: { label: string; value: number; color: string }[];
  statusBreakdown: { label: string; value: number; color: string }[];
  signupsTrend: { label: string; value: number }[];
  conversionRate: number;
  trialsEndedCount: number;
}

const PLAN_ORDER: SubscriptionPlan[] = ["starter", "growth", "pro", "enterprise"];
const PLAN_LABELS: Record<SubscriptionPlan, string> = {
  starter: "Starter",
  growth: "Growth",
  pro: "Pro",
  enterprise: "Enterprise",
};
// Reference-theme categorical steps (see app/globals.css) — a fixed order,
// distinct from the status tokens below, per plan tier.
const PLAN_COLORS: Record<SubscriptionPlan, string> = {
  starter: "var(--chart-blue)",
  growth: "var(--chart-orange)",
  pro: "var(--chart-aqua)",
  enterprise: "var(--chart-yellow)",
};

const STATUS_ORDER: SubscriptionStatus[] = [
  "trialing",
  "active",
  "past_due",
  "canceled",
  "incomplete",
];
const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  trialing: "Trialing",
  active: "Active",
  past_due: "Past due",
  canceled: "Canceled",
  incomplete: "Incomplete",
};
// Same semantics as the Badge variants in app/(platform)/admin/companies/page.tsx.
const STATUS_COLORS: Record<SubscriptionStatus, string> = {
  trialing: "hsl(var(--muted-foreground))",
  active: "hsl(var(--success))",
  past_due: "hsl(var(--warning))",
  canceled: "hsl(var(--destructive))",
  incomplete: "hsl(var(--destructive))",
};

/**
 * FieldOS's own SaaS business metrics — MRR, subscription mix, signups,
 * trial conversion. Reads every company row once via the service-role client
 * and reduces in JS; replace with a SQL aggregate/view if the platform grows
 * past a few thousand companies.
 */
export async function getPlatformReports(
  supabase: Client
): Promise<PlatformReports> {
  const { data: companies } = await supabase
    .from("companies")
    .select(
      "id, subscription_plan, subscription_status, region, created_at, trial_ends_at"
    )
    .limit(5000);

  const rows = companies ?? [];
  const now = new Date();

  let mrrGBP = 0;
  let mrrEUR = 0;
  let activeCount = 0;
  let trialingCount = 0;
  let trialsEndedCount = 0;
  let trialsConvertedCount = 0;

  const planCounts = new Map<SubscriptionPlan, number>();
  const statusCounts = new Map<SubscriptionStatus, number>();

  // Signups trend: bucket companies into the last six calendar months —
  // same bucketing shape as app/(app)/dashboard/page.tsx's revenue trend.
  const signupsTrend = [0, 1, 2, 3, 4, 5].map((i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return {
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleDateString("en-GB", { month: "short" }),
      value: 0,
    };
  });

  for (const row of rows) {
    planCounts.set(row.subscription_plan, (planCounts.get(row.subscription_plan) ?? 0) + 1);
    statusCounts.set(
      row.subscription_status,
      (statusCounts.get(row.subscription_status) ?? 0) + 1
    );

    if (row.subscription_status === "active") {
      activeCount++;
      const plan = planById(row.subscription_plan);
      if (plan) {
        if (row.region === "DE" && plan.priceEUR !== null) mrrEUR += plan.priceEUR;
        if (row.region === "UK" && plan.priceGBP !== null) mrrGBP += plan.priceGBP;
      }
    }
    if (row.subscription_status === "trialing") trialingCount++;

    if (row.trial_ends_at && new Date(row.trial_ends_at) < now) {
      trialsEndedCount++;
      if (row.subscription_status === "active" || row.subscription_status === "past_due") {
        trialsConvertedCount++;
      }
    }

    const created = new Date(row.created_at);
    const bucket = signupsTrend.find(
      (m) => m.key === `${created.getFullYear()}-${created.getMonth()}`
    );
    if (bucket) bucket.value += 1;
  }

  const planBreakdown = PLAN_ORDER.map((plan) => ({
    label: PLAN_LABELS[plan],
    value: planCounts.get(plan) ?? 0,
    color: PLAN_COLORS[plan],
  }));

  const statusBreakdown = STATUS_ORDER.map((status) => ({
    label: STATUS_LABELS[status],
    value: statusCounts.get(status) ?? 0,
    color: STATUS_COLORS[status],
  }));

  return {
    mrrGBP,
    mrrEUR,
    activeCount,
    trialingCount,
    totalCount: rows.length,
    planBreakdown,
    statusBreakdown,
    signupsTrend: signupsTrend.map(({ label, value }) => ({ label, value })),
    conversionRate:
      trialsEndedCount > 0 ? (trialsConvertedCount / trialsEndedCount) * 100 : 0,
    trialsEndedCount,
  };
}
