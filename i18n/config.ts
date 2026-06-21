export const locales = ["en", "de"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "English",
  de: "Deutsch",
};

/** VAT defaults switch by region (UK 20%, DE 19%). */
export const regionVatRate: Record<"UK" | "DE", number> = {
  UK: 0.2,
  DE: 0.19,
};

export const regionCurrency: Record<"UK" | "DE", "GBP" | "EUR"> = {
  UK: "GBP",
  DE: "EUR",
};

export const regionLocaleTag: Record<"UK" | "DE", string> = {
  UK: "en-GB",
  DE: "de-DE",
};
