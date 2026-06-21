"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { updateInvoiceLineItems } from "@/app/(app)/invoices/actions";
import { Button } from "@/components/ui/button";
import {
  LineItemsEditor,
  type EditableLineItem,
} from "@/components/estimate/LineItemsEditor";
import { useToast } from "@/hooks/use-toast";

/** Inline line-item editor for draft invoices (e.g. invoices with no estimate). */
export function InvoiceEditor({
  id,
  initialItems,
  vatRate,
  region,
}: {
  id: string;
  initialItems: EditableLineItem[];
  vatRate: number;
  region: "UK" | "DE";
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [items, setItems] = useState<EditableLineItem[]>(
    initialItems.length > 0
      ? initialItems
      : [{ description: "", quantity: 1, unit_price: 0, kind: "labour" }]
  );
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const res = await updateInvoiceLineItems(
      id,
      items.map((li) => ({
        description: li.description,
        quantity: Number(li.quantity) || 0,
        unit_price: Number(li.unit_price) || 0,
        kind: li.kind,
      }))
    );
    setSaving(false);
    if (!res.ok) {
      toast({ variant: "destructive", description: res.error });
      return;
    }
    toast({ description: "Invoice saved." });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <LineItemsEditor
        items={items}
        onChange={setItems}
        vatRate={vatRate}
        region={region}
      />
      <div className="flex justify-end">
        <Button onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save invoice"}
        </Button>
      </div>
    </div>
  );
}
