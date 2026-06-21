import { requireSection } from "@/lib/auth/session";
import { BillingPanel } from "@/components/settings/BillingPanel";

export const metadata = { title: "Billing" };

export default async function BillingSettingsPage() {
  const ctx = await requireSection("billing");

  return (
    <BillingPanel
      currentPlan={ctx.company.subscription_plan}
      status={ctx.company.subscription_status}
      region={ctx.company.region}
      hasSubscription={Boolean(ctx.company.stripe_subscription_id)}
      isOwner={ctx.role === "owner"}
    />
  );
}
