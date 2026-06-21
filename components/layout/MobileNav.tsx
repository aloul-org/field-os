"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { MoreHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";
import type { NavItem } from "@/components/layout/nav-items";
import { NAV_ICON_MAP } from "@/components/layout/nav-icon-map";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Bottom tab bar (mobile/tablet) with the 4 top items + a "More" overflow. */
export function MobileNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const [moreOpen, setMoreOpen] = useState(false);

  const primary = items.slice(0, 4);
  const overflow = items.slice(4);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-stretch border-t bg-card lg:hidden">
      {primary.map(({ key, href, icon }) => {
        const Icon = NAV_ICON_MAP[icon];
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
              active ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            {t(key)}
          </Link>
        );
      })}

      {overflow.length > 0 && (
        <Dialog open={moreOpen} onOpenChange={setMoreOpen}>
          <DialogTrigger
            className="flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-muted-foreground"
            aria-label="More"
          >
            <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
            More
          </DialogTrigger>
          <DialogContent className="top-auto bottom-0 translate-y-0 rounded-b-none sm:rounded-lg">
            <DialogHeader>
              <DialogTitle>Menu</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-3 gap-3">
              {overflow.map(({ key, href, icon }) => {
                const Icon = NAV_ICON_MAP[icon];
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMoreOpen(false)}
                    className="flex flex-col items-center gap-2 rounded-lg border p-4 text-sm hover:bg-muted"
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                    <span className="text-center text-xs">{t(key)}</span>
                  </Link>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </nav>
  );
}
