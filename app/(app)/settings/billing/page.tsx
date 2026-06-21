import { SettingsPlaceholder } from "@/components/settings/SettingsPlaceholder";

export const metadata = { title: "Billing" };

export default function BillingSettingsPage() {
  return (
    <SettingsPlaceholder
      title="Billing & subscription"
      description="Manage your plan, payment method and the 0.5% platform fee. Wired up with Stripe in Phase 2."
    />
  );
}
