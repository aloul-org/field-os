import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireSection } from "@/lib/auth/session";
import { canWrite } from "@/lib/auth/roles";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  EstimateBuilder,
  type InitialDraft,
} from "@/components/estimate/EstimateBuilder";
import type { PickedCustomer } from "@/components/estimate/CustomerPicker";
import type { EditableLineItem } from "@/components/estimate/LineItemsEditor";
import type { LineItem } from "@/lib/types/database";

export const metadata = { title: "Edit estimate" };

export default async function EditEstimatePage({
  params,
}: {
  params: { id: string };
}) {
  const ctx = await requireSection("estimates");
  if (!canWrite(ctx.role)) redirect(`/estimates/${params.id}`);

  const supabase = createClient();
  const { data: estimate } = await supabase
    .from("estimates")
    .select("*, customers(id, name)")
    .eq("id", params.id)
    .eq("company_id", ctx.company.id)
    .maybeSingle();

  if (!estimate) notFound();
  // Only drafts are editable — send everything else back to the read-only view.
  if (estimate.status !== "draft") redirect(`/estimates/${params.id}`);

  const customer = estimate.customers as unknown as { id: string; name: string } | null;
  const initialCustomer: PickedCustomer | null = customer
    ? { id: customer.id, name: customer.name, propertyId: estimate.property_id }
    : null;

  const lineItems = (estimate.line_items ?? []) as LineItem[];
  const initialDraft: InitialDraft = {
    jobTitle: estimate.job_title,
    summary: estimate.summary_for_customer,
    description: estimate.job_description_raw ?? "",
    vatRate: Number(estimate.vat_rate),
    confidence: estimate.ai_confidence,
    flags: (estimate.ai_flags ?? []) as string[],
    lineItems: lineItems.map(
      (li): EditableLineItem => ({
        description: li.description,
        quantity: li.quantity,
        unit_price: li.unit_price,
        kind: li.kind,
      })
    ),
  };

  return (
    <div>
      <PageHeader
        title={`Edit ${estimate.estimate_number}`}
        description="Update the line items, pricing or customer — changes save back to this draft."
      />
      <EstimateBuilder
        estimateId={estimate.id}
        initialCustomer={initialCustomer}
        region={ctx.company.region}
        initialDraft={initialDraft}
      />
    </div>
  );
}
