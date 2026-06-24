"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { publicEnv } from "@/lib/env";
import { useCommandMenu } from "@/lib/stores/commandMenu";
import { type NavItem, groupNavItems } from "@/components/layout/nav-items";
import { NAV_ICON_MAP } from "@/components/layout/nav-icon-map";

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const setOpen = useCommandMenu((s) => s.setOpen);
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(/mac/i.test(navigator.platform));
  }, []);

  const groups = groupNavItems(items);

  return (
    <aside className="hidden w-64 shrink-0 border-r bg-card/70 backdrop-blur lg:flex lg:flex-col">
      {/* Brand */}
      <div className="flex h-14 items-center gap-2.5 border-b px-5">
        <span className="relative grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-primary/80 font-display font-bold text-primary-foreground shadow-sm">
          F
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-success ring-2 ring-card" />
        </span>
        <span className="truncate font-display font-semibold tracking-tight">
          {publicEnv.appName}
        </span>
      </div>

      {/* Search → command palette */}
      <div className="px-3 pt-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group flex w-full items-center gap-2 rounded-lg border bg-background/50 px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
        >
          <Search className="h-4 w-4 transition-colors group-hover:text-primary" aria-hidden="true" />
          <span className="flex-1 text-left">Search…</span>
          <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium">
            {isMac ? "⌘" : "Ctrl"} K
          </kbd>
        </button>
      </div>

      {/* Grouped, colour-coded navigation */}
      <nav className="flex-1 space-y-5 overflow-y-auto scrollbar-slim px-3 py-4">
        {groups.map((group) => (
          <div key={group.id}>
            <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map(({ key, href, icon }) => {
                const Icon = NAV_ICON_MAP[icon];
                const active = isActive(pathname, href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group/item relative flex items-center gap-3 rounded-lg py-1.5 pl-3 pr-3 text-sm transition-all duration-150",
                        active
                          ? cn(group.rowActive, "font-semibold text-foreground")
                          : "font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      {active && (
                        <span
                          aria-hidden="true"
                          className={cn(
                            "absolute -left-3 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full",
                            group.bar
                          )}
                        />
                      )}
                      <span
                        className={cn(
                          "grid h-7 w-7 shrink-0 place-items-center rounded-md transition-colors",
                          active
                            ? group.chipActive
                            : cn(group.chipIdle, "group-hover/item:brightness-95")
                        )}
                      >
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span className="truncate">{t(key)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
