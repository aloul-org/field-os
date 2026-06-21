"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

const TABS = [
  { href: "/settings", key: "company" },
  { href: "/settings/billing", key: "billing" },
  { href: "/settings/lead-capture", key: "leadCapture" },
  { href: "/settings/voice-receptionist", key: "voiceReceptionist" },
  { href: "/settings/notifications", key: "notifications" },
  { href: "/settings/integrations", key: "integrations" },
] as const;

export function SettingsNav() {
  const pathname = usePathname();
  const t = useTranslations("settings");

  return (
    <nav className="mb-6 flex gap-1 overflow-x-auto border-b">
      {TABS.map(({ href, key }) => {
        const active =
          href === "/settings"
            ? pathname === "/settings"
            : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t(key)}
          </Link>
        );
      })}
    </nav>
  );
}
