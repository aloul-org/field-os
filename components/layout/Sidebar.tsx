"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { publicEnv } from "@/lib/env";
import { useCommandMenu } from "@/lib/stores/commandMenu";
import type { NavItem } from "@/components/layout/nav-items";
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

  return (
    <aside className="hidden w-64 shrink-0 border-r bg-card/60 backdrop-blur lg:flex lg:flex-col">
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

      {/* The Route Line — each section is a stop, your page glows. */}
      <nav className="relative flex-1 overflow-y-auto scrollbar-slim px-3 py-4">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-6 left-[1.45rem] top-6 w-px bg-gradient-to-b from-transparent via-border to-transparent"
        />
        <ul className="space-y-0.5">
          {items.map(({ key, href, icon }) => {
            const Icon = NAV_ICON_MAP[icon];
            const active = isActive(pathname, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-lg py-2 pl-9 pr-3 text-sm transition-all duration-150",
                    active
                      ? "bg-primary/10 font-semibold text-primary"
                      : "font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {/* Stop marker on the route line */}
                  <span
                    aria-hidden="true"
                    className="absolute left-[1.45rem] grid -translate-x-1/2 place-items-center"
                  >
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full ring-4 ring-card transition-all duration-150",
                        active
                          ? "scale-110 bg-primary"
                          : "bg-border group-hover:bg-foreground/40"
                      )}
                    />
                    {active && (
                      <span className="absolute h-2 w-2 rounded-full bg-primary animate-pulse-ring" />
                    )}
                  </span>
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">{t(key)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
