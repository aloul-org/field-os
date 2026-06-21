"use server";

import { cookies } from "next/headers";

import { locales, defaultLocale, type Locale } from "@/i18n/config";

/**
 * Persist the active locale in a cookie. Called at login (from the company's
 * `language`) and from the language switcher in settings.
 */
export async function setLocaleCookie(locale: string) {
  const resolved: Locale = locales.includes(locale as Locale)
    ? (locale as Locale)
    : defaultLocale;
  cookies().set("NEXT_LOCALE", resolved, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
