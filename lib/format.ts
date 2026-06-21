import {
  regionCurrency,
  regionLocaleTag,
  type Locale,
} from "@/i18n/config";

type Region = "UK" | "DE";

/**
 * Format money in the company's regional currency (GBP for UK, EUR for DE).
 * All amounts in the DB are stored as plain decimals in the major unit.
 */
export function formatCurrency(amount: number, region: Region = "UK"): string {
  return new Intl.NumberFormat(regionLocaleTag[region], {
    style: "currency",
    currency: regionCurrency[region],
  }).format(amount);
}

export function formatDate(
  value: string | Date,
  region: Region = "UK",
  opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }
): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat(regionLocaleTag[region], opts).format(date);
}

export function formatDateTime(value: string | Date, region: Region = "UK"): string {
  return formatDate(value, region, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTime(value: string | Date, region: Region = "UK"): string {
  return formatDate(value, region, { hour: "2-digit", minute: "2-digit" });
}

/** Relative "2 hours ago" style for activity feeds. */
export function formatRelative(value: string | Date, locale: Locale = "en"): string {
  const date = typeof value === "string" ? new Date(value) : value;
  const diffMs = date.getTime() - Date.now();
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const divisions: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, "seconds"],
    [60, "minutes"],
    [24, "hours"],
    [7, "days"],
    [4.34524, "weeks"],
    [12, "months"],
    [Number.POSITIVE_INFINITY, "years"],
  ];
  let duration = diffMs / 1000;
  for (const [amount, unit] of divisions) {
    if (Math.abs(duration) < amount) {
      return rtf.format(Math.round(duration), unit);
    }
    duration /= amount;
  }
  return rtf.format(Math.round(duration), "years");
}

/** Build a human initials string for avatar fallbacks. */
export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/** Sequential document numbers, e.g. EST-2026-0042. */
export function formatDocNumber(prefix: string, seq: number, year = new Date().getFullYear()): string {
  return `${prefix}-${year}-${String(seq).padStart(4, "0")}`;
}
