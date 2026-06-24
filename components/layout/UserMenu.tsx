"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { LogOut, Languages, Settings as SettingsIcon } from "lucide-react";

import { initials } from "@/lib/format";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { setLocaleCookie } from "@/i18n/actions";
import { logout } from "@/app/(app)/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TeamRole } from "@/lib/types/database";

export function UserMenu({
  name,
  email,
  role,
  avatarUrl,
}: {
  name: string;
  email: string;
  role: TeamRole;
  avatarUrl: string | null;
}) {
  const t = useTranslations("nav");
  const locale = useLocale() as "en" | "de";
  const router = useRouter();
  const [, startTransition] = useTransition();

  function switchLanguage(lang: "en" | "de") {
    startTransition(async () => {
      await setLocaleCookie(lang);
      router.refresh();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <Avatar>
          {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
          <AvatarFallback>{initials(name)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="font-medium">{name}</span>
            <span className="text-xs font-normal text-muted-foreground">
              {email}
            </span>
            <span className="mt-1 text-xs font-normal text-primary">
              {ROLE_LABELS[role]}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/settings")}>
          <SettingsIcon className="h-4 w-4" /> {t("settings")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => switchLanguage(locale === "en" ? "de" : "en")}
        >
          <Languages className="h-4 w-4" />
          {locale === "en" ? "Deutsch" : "English"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => startTransition(() => void logout())}
        >
          <LogOut className="h-4 w-4" /> {t("logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
