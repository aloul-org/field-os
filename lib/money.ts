import type { LineItem } from "@/lib/types/database";

/** Round to 2 decimal places (currency). */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export interface MoneyTotals {
  line_items: LineItem[];
  subtotal: number;
  vat_amount: number;
  total_inc_vat: number;
}

export type RawLineItem = Omit<LineItem, "line_total"> & { line_total?: number };

/**
 * Recompute every money value server-side. The LLM is only ever trusted for
 * descriptions/quantities/unit prices — never for arithmetic. Each line_total,
 * the subtotal, VAT and grand total are recalculated here in code (spec:
 * "never trust LLM arithmetic").
 */
export function computeTotals(
  items: RawLineItem[],
  vatRate: number
): MoneyTotals {
  const line_items: LineItem[] = items.map((i) => ({
    description: i.description,
    quantity: i.quantity,
    unit_price: i.unit_price,
    kind: i.kind,
    line_total: round2(Number(i.quantity) * Number(i.unit_price)),
  }));
  const subtotal = round2(line_items.reduce((s, i) => s + i.line_total, 0));
  const vat_amount = round2(subtotal * vatRate);
  const total_inc_vat = round2(subtotal + vat_amount);
  return { line_items, subtotal, vat_amount, total_inc_vat };
}
