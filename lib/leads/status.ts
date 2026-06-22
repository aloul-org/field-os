import type { LeadStatus, LeadSource } from "@/lib/types/database";

type BadgeVariant = "secondary" | "default" | "success" | "destructive" | "warning";

export const LEAD_STATUS_META: Record<
  LeadStatus,
  { label: string; variant: BadgeVariant }
> = {
  new: { label: "New", variant: "default" },
  contacted: { label: "Contacted", variant: "secondary" },
  quoted: { label: "Quoted", variant: "warning" },
  converted: { label: "Won", variant: "success" },
  lost: { label: "Lost", variant: "destructive" },
  spam: { label: "Spam", variant: "secondary" },
};

/** Inbox filter tabs, in workflow order. "all" is handled by the page. */
export const LEAD_STATUS_TABS: { key: LeadStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "contacted", label: "Contacted" },
  { key: "quoted", label: "Quoted" },
  { key: "converted", label: "Won" },
  { key: "lost", label: "Lost" },
];

export const LEAD_SOURCE_LABEL: Record<LeadSource, string> = {
  phone_call: "Phone call",
  whatsapp: "WhatsApp",
  sms: "SMS",
  website_widget: "Website",
  facebook: "Facebook",
  instagram: "Instagram",
  manual: "Manual",
  email: "Email",
};
