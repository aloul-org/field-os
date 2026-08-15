"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { BarChart3, Building2 } from "lucide-react";

import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/admin", labelKey: "navReports", icon: BarChart3, exact: true },
  { href: "/admin/companies", labelKey: "navCompanies", icon: Building2, exact: false },
] as const;

export function AdminNav() {
  const t = useTranslations("admin");
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1">
      {ITEMS.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className="h-4 w-4" aria-hidden="true" />
            {t(item.labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}
