import type { EstimateStatus } from "@/lib/types/database";

type BadgeVariant = "secondary" | "default" | "success" | "warning" | "destructive";

/**
 * Status metadata without translated labels — labels are looked up via
 * `useTranslations("status")` / `getTranslations("status")` in the rendering
 * component, keyed as `status.estimate.<key>` (see messages/en.json + de.json).
 */
export const ESTIMATE_STATUS_META: Record<EstimateStatus, { variant: BadgeVariant }> = {
  draft: { variant: "secondary" },
  sent: { variant: "default" },
  accepted: { variant: "success" },
  rejected: { variant: "destructive" },
  expired: { variant: "secondary" },
};

/** Status values, in lifecycle order. Labels come from `status.estimate.<key>`. */
export const ESTIMATE_STATUSES: EstimateStatus[] = [
  "draft",
  "sent",
  "accepted",
  "rejected",
  "expired",
];
