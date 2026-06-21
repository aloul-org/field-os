import { createClient } from "@/lib/supabase/server";
import { requireSection } from "@/lib/auth/session";
import { PageHeader } from "@/components/shared/PageHeader";
import { EstimateBuilder } from "@/components/estimate/EstimateBuilder";
import type { PickedCustomer } from "@/components/estimate/CustomerPicker";

export const metadata = { title: "New estimate" };

export default async function NewEstimatePage({
  searchParams,
}: {
  searchParams: { customerId?: string; leadId?: string };
}) {
  const ctx = await requireSection("estimates");
  const supabase = createClient();

  // Resolve a prefill customer from ?customerId or ?leadId.
  let initialCustomer: PickedCustomer | null = null;
  let customerId = searchParams.customerId;
  if (!customerId && searchParams.leadId) {
    const { data: lead } = await supabase
      .from("leads")
      .select("customer_id")
      .eq("id", searchParams.leadId)
      .maybeSingle();
    customerId = lead?.customer_id ?? undefined;
  }
  if (customerId) {
    const { data: c } = await supabase
      .from("customers")
      .select("id, name, properties(id)")
      .eq("id", customerId)
      .maybeSingle();
    if (c) {
      const props = c.properties as unknown as { id: string }[] | null;
      initialCustomer = {
        id: c.id,
        name: c.name,
        propertyId: props?.[0]?.id ?? null,
      };
    }
  }

  return (
    <div>
      <PageHeader
        title="New estimate"
        description="Speak, type or photograph the job — FieldOS drafts a priced quote."
      />
      <EstimateBuilder
        initialCustomer={initialCustomer}
        region={ctx.company.region}
      />
    </div>
  );
}
