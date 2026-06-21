import {
  LayoutDashboard,
  Inbox,
  Phone,
  CalendarDays,
  Briefcase,
  FileText,
  Receipt,
  Users,
  Package,
  TrendingUp,
  Bot,
  Star,
  UsersRound,
  Settings,
  type LucideIcon,
} from "lucide-react";

import type { AppSection } from "@/lib/auth/roles";

export interface NavItem {
  /** i18n key under the `nav` namespace. */
  key: string;
  href: string;
  icon: LucideIcon;
  section: AppSection;
  /** Hidden by default for solo accounts (re-appears when a team is added). */
  hideForSolo?: boolean;
}

/** Sidebar order = priority of daily use (per spec), not module numbering. */
export const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", href: "/dashboard", icon: LayoutDashboard, section: "dashboard" },
  { key: "leads", href: "/leads", icon: Inbox, section: "leads" },
  { key: "calls", href: "/calls", icon: Phone, section: "calls" },
  { key: "schedule", href: "/schedule", icon: CalendarDays, section: "schedule", hideForSolo: true },
  { key: "jobs", href: "/jobs", icon: Briefcase, section: "jobs" },
  { key: "estimates", href: "/estimates", icon: FileText, section: "estimates" },
  { key: "invoices", href: "/invoices", icon: Receipt, section: "invoices" },
  { key: "customers", href: "/customers", icon: Users, section: "customers" },
  { key: "materials", href: "/materials", icon: Package, section: "materials" },
  { key: "finance", href: "/finance", icon: TrendingUp, section: "finance" },
  { key: "coach", href: "/coach", icon: Bot, section: "coach" },
  { key: "reviews", href: "/reviews", icon: Star, section: "reviews" },
  { key: "team", href: "/team", icon: UsersRound, section: "team", hideForSolo: true },
  { key: "settings", href: "/settings", icon: Settings, section: "settings" },
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
