"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ListChecks, Bot, User } from "lucide-react";

import { cn } from "@/lib/utils";

const TABS = [
  { href: "/tech/today", label: "Today", icon: ListChecks },
  { href: "/tech/copilot", label: "Copilot", icon: Bot },
  { href: "/tech/profile", label: "Profile", icon: User },
];

/** Three-tab bottom bar — the only navigation in the technician PWA. */
export function TechBottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex h-20 items-stretch border-t border-border bg-card">
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 text-sm font-medium",
              active ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Icon className="h-6 w-6" aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
