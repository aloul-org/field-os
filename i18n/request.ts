import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

import { locales, defaultLocale, type Locale } from "@/i18n/config";

/**
 * Locale is resolved from the NEXT_LOCALE cookie (set from the company's
 * `language` setting at login), not from the URL — this product is an
 * authenticated app whose locale follows the account, so we deliberately avoid
 * locale-prefixed routing and keep the route tree matching the spec exactly.
 */
export default getRequestConfig(async () => {
  const cookieStore = cookies();
  const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value;
  const locale: Locale = locales.includes(cookieLocale as Locale)
    ? (cookieLocale as Locale)
    : defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
