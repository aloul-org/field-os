import type { InvoiceStatus } from "@/lib/types/database";

type BadgeVariant = "secondary" | "default" | "success" | "warning" | "destructive";

/**
 * Status metadata without translated labels — labels are looked up via
 * `useTranslations("status")` / `getTranslations("status")` in the rendering
 * component, keyed as `status.invoice.<key>` (see messages/en.json + de.json).
 */
export const INVOICE_STATUS_META: Record<InvoiceStatus, { variant: BadgeVariant }> = {
  draft: { variant: "secondary" },
  sent: { variant: "default" },
  paid: { variant: "success" },
  overdue: { variant: "destructive" },
  cancelled: { variant: "secondary" },
};

/** Status values, in lifecycle order. Labels come from `status.invoice.<key>`. */
export const INVOICE_STATUSES: InvoiceStatus[] = [
  "draft",
  "sent",
  "paid",
  "overdue",
  "cancelled",
];
