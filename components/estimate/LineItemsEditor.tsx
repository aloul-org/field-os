"use client";

import { Plus, Trash2 } from "lucide-react";

import { computeTotals } from "@/lib/money";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { LineItem } from "@/lib/types/database";

export type EditableLineItem = Omit<LineItem, "line_total">;

const KINDS: NonNullable<LineItem["kind"]>[] = [
  "labour",
  "material",
  "call_out",
  "other",
];

export function LineItemsEditor({
  items,
  onChange,
  vatRate,
  region,
}: {
  items: EditableLineItem[];
  onChange: (items: EditableLineItem[]) => void;
  vatRate: number;
  region: "UK" | "DE";
}) {
  const totals = computeTotals(items, vatRate);

  function update(index: number, patch: Partial<EditableLineItem>) {
    onChange(items.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }
  function remove(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }
  function add() {
    onChange([
      ...items,
      { description: "", quantity: 1, unit_price: 0, kind: "labour" },
    ]);
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {items.map((item, i) => (
          <div
            key={i}
            className="grid grid-cols-1 gap-2 rounded-lg border p-2 sm:grid-cols-[1fr_5rem_7rem_7rem_auto] sm:items-center"
          >
            <Input
              aria-label="Description"
              placeholder="Description"
              value={item.description}
              onChange={(e) => update(i, { description: e.target.value })}
            />
            <Input
              aria-label="Quantity"
              type="number"
              inputMode="decimal"
              step="0.5"
              value={Number.isFinite(item.quantity) ? item.quantity : ""}
              onChange={(e) =>
                update(i, { quantity: e.target.valueAsNumber || 0 })
              }
            />
            <Input
              aria-label="Unit price"
              type="number"
              inputMode="decimal"
              step="0.01"
              value={Number.isFinite(item.unit_price) ? item.unit_price : ""}
              onChange={(e) =>
                update(i, { unit_price: e.target.valueAsNumber || 0 })
              }
            />
            <Select
              value={item.kind ?? "other"}
              onValueChange={(v) =>
                update(i, { kind: v as LineItem["kind"] })
              }
            >
              <SelectTrigger aria-label="Type" className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {KINDS.map((k) => (
                  <SelectItem key={k} value={k} className="capitalize">
                    {k.replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Remove line"
              onClick={() => remove(i)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>

      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus className="h-4 w-4" /> Add line item
      </Button>

      <div className="ml-auto max-w-xs space-y-1 pt-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatCurrency(totals.subtotal, region)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">
            VAT ({(vatRate * 100).toFixed(0)}%)
          </span>
          <span>{formatCurrency(totals.vat_amount, region)}</span>
        </div>
        <div className="flex justify-between border-t pt-1 text-base font-semibold">
          <span>Total</span>
          <span>{formatCurrency(totals.total_inc_vat, region)}</span>
        </div>
      </div>
    </div>
  );
}
