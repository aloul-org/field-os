import type { AppSection } from "@/lib/auth/roles";

/** Lucide icon name (resolved client-side via NAV_ICON_MAP) — not the component itself, since
 * NavItem[] crosses the server/client boundary as a prop and functions can't be serialized. */
export type NavIconName =
  | "Home"
  | "LayoutGrid"
  | "Inbox"
  | "PhoneCall"
  | "FileText"
  | "Users"
  | "CalendarDays"
  | "Wrench"
  | "Boxes"
  | "Receipt"
  | "LineChart"
  | "Sparkles"
  | "Star"
  | "UsersRound"
  | "Settings";

export type NavGroupId =
  | "home"
  | "overview"
  | "sales"
  | "operations"
  | "money"
  | "insights"
  | "workspace";

/** Group metadata. Each group carries its own colour identity for the nav —
 * static class strings so Tailwind's JIT picks them up. */
export interface NavGroup {
  id: NavGroupId;
  label: string;
  /** Idle icon chip (tinted). */
  chipIdle: string;
  /** Active icon chip (solid). */
  chipActive: string;
  /** Active row background. */
  rowActive: string;
  /** Active left indicator bar. */
  bar: string;
}

export const NAV_GROUPS: NavGroup[] = [
  {
    id: "home",
    label: "Home",
    chipIdle: "bg-primary/10 text-primary",
    chipActive: "bg-primary text-primary-foreground",
    rowActive: "bg-primary/10",
    bar: "bg-primary",
  },
  {
    id: "overview",
    label: "Overview",
    chipIdle: "bg-primary/10 text-primary",
    chipActive: "bg-primary text-primary-foreground",
    rowActive: "bg-primary/10",
    bar: "bg-primary",
  },
  {
    id: "sales",
    label: "Sales",
    chipIdle: "bg-[#2563EB]/10 text-[#2563EB]",
    chipActive: "bg-[#2563EB] text-white",
    rowActive: "bg-[#2563EB]/10",
    bar: "bg-[#2563EB]",
  },
  {
    id: "operations",
    label: "Operations",
    chipIdle: "bg-[#7C3AED]/10 text-[#7C3AED]",
    chipActive: "bg-[#7C3AED] text-white",
    rowActive: "bg-[#7C3AED]/10",
    bar: "bg-[#7C3AED]",
  },
  {
    id: "money",
    label: "Money",
    chipIdle: "bg-success/10 text-success",
    chipActive: "bg-success text-success-foreground",
    rowActive: "bg-success/10",
    bar: "bg-success",
  },
  {
    id: "insights",
    label: "Insights",
    chipIdle: "bg-[#0EA5E9]/10 text-[#0EA5E9]",
    chipActive: "bg-[#0EA5E9] text-white",
    rowActive: "bg-[#0EA5E9]/10",
    bar: "bg-[#0EA5E9]",
  },
  {
    id: "workspace",
    label: "Workspace",
    chipIdle: "bg-muted text-muted-foreground",
    chipActive: "bg-foreground text-background",
    rowActive: "bg-muted",
    bar: "bg-foreground",
  },
];

export interface NavItem {
  /** i18n key under the `nav` namespace. */
  key: string;
  href: string;
  icon: NavIconName;
  section: AppSection;
  group: NavGroupId;
  /** Hidden by default for solo accounts (re-appears when a team is added). */
  hideForSolo?: boolean;
}

/** Grouped for the sidebar; flat order also drives the mobile bottom bar. */
export const NAV_ITEMS: NavItem[] = [
  // Headline feature — first thing users see, and the post-login landing page.
  { key: "home", href: "/estimates/new", icon: "Home", section: "estimates", group: "home" },

  { key: "dashboard", href: "/dashboard", icon: "LayoutGrid", section: "dashboard", group: "overview" },

  { key: "leads", href: "/leads", icon: "Inbox", section: "leads", group: "sales" },
  { key: "calls", href: "/calls", icon: "PhoneCall", section: "calls", group: "sales" },
  { key: "estimates", href: "/estimates", icon: "FileText", section: "estimates", group: "sales" },
  { key: "customers", href: "/customers", icon: "Users", section: "customers", group: "sales" },

  { key: "schedule", href: "/schedule", icon: "CalendarDays", section: "schedule", group: "operations", hideForSolo: true },
  { key: "jobs", href: "/jobs", icon: "Wrench", section: "jobs", group: "operations" },
  { key: "materials", href: "/materials", icon: "Boxes", section: "materials", group: "operations" },

  { key: "invoices", href: "/invoices", icon: "Receipt", section: "invoices", group: "money" },
  { key: "finance", href: "/finance", icon: "LineChart", section: "finance", group: "money" },

  { key: "coach", href: "/coach", icon: "Sparkles", section: "coach", group: "insights" },
  { key: "reviews", href: "/reviews", icon: "Star", section: "reviews", group: "insights" },

  { key: "team", href: "/team", icon: "UsersRound", section: "team", group: "workspace", hideForSolo: true },
  { key: "settings", href: "/settings", icon: "Settings", section: "settings", group: "workspace" },
];

/** Filter nav by role access + solo-account hiding. */
export function visibleNavItems(
  accessible: AppSection[],
  isSolo: boolean
): NavItem[] {
  return NAV_ITEMS.filter(
    (item) =>
      accessible.includes(item.section) && !(isSolo && item.hideForSolo)
  );
}

/** Bucket visible items into their groups, dropping any group left empty. */
export function groupNavItems(
  items: NavItem[]
): (NavGroup & { items: NavItem[] })[] {
  return NAV_GROUPS.map((g) => ({
    ...g,
    items: items.filter((i) => i.group === g.id),
  })).filter((g) => g.items.length > 0);
}
