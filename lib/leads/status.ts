import type { LeadStatus, LeadSource } from "@/lib/types/database";

type BadgeVariant = "secondary" | "default" | "success" | "destructive" | "warning";

/**
 * Status metadata without translated labels — labels are looked up via
 * `useTranslations("status")` / `getTranslations("status")` in the rendering
 * component, keyed as `status.lead.<key>` (see messages/en.json + de.json).
 * Keeping the key here, not the label, lets the same data drive both locales.
 */
export const LEAD_STATUS_META: Record<LeadStatus, { variant: BadgeVariant }> = {
  new: { variant: "default" },
  contacted: { variant: "secondary" },
  quoted: { variant: "warning" },
  converted: { variant: "success" },
  lost: { variant: "destructive" },
  spam: { variant: "secondary" },
};

/** Inbox filter tabs, in workflow order. "all" is handled by the page. */
export const LEAD_STATUS_TABS: (LeadStatus | "all")[] = [
  "all",
  "new",
  "contacted",
  "quoted",
  "converted",
  "lost",
];

/** Source values, in display order. Labels come from `status.leadSource.<key>`. */
export const LEAD_SOURCES: LeadSource[] = [
  "phone_call",
  "whatsapp",
  "sms",
  "website_widget",
  "facebook",
  "instagram",
  "manual",
  "email",
];
