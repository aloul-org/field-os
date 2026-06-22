/**
 * Renewal eligibility rules (spec Module 10) — a simple keyword/category table,
 * editable later. Maps recurring service types to a default interval so a
 * completed job can suggest a renewal plan (e.g. annual boiler service).
 */
interface RenewalRule {
  /** Keywords matched (case-insensitive) against the job title/description. */
  keywords: string[];
  planType: string;
  intervalMonths: number;
}

const RULES: RenewalRule[] = [
  { keywords: ["boiler service", "boiler", "annual service"], planType: "Annual boiler service", intervalMonths: 12 },
  { keywords: ["gutter", "gutter clean"], planType: "Gutter cleaning", intervalMonths: 12 },
  { keywords: ["gas safety", "landlord certificate", "cp12"], planType: "Gas safety check", intervalMonths: 12 },
  { keywords: ["service", "maintenance", "inspection"], planType: "Maintenance plan", intervalMonths: 12 },
  { keywords: ["air con", "aircon", "hvac", "a/c"], planType: "Air-con service", intervalMonths: 6 },
];

export interface RenewalSuggestion {
  planType: string;
  intervalMonths: number;
}

/** Suggest a renewal plan for a job, or null if nothing matches. */
export function suggestRenewal(text: string): RenewalSuggestion | null {
  const lower = text.toLowerCase();
  for (const rule of RULES) {
    if (rule.keywords.some((k) => lower.includes(k))) {
      return { planType: rule.planType, intervalMonths: rule.intervalMonths };
    }
  }
  return null;
}

/** Add N months to a YYYY-MM-DD date, returning YYYY-MM-DD. */
export function addMonths(fromISODate: string, months: number): string {
  const d = new Date(`${fromISODate}T00:00:00.000Z`);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
}
