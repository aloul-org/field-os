import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/types/database";

type DocTable = "estimates" | "invoices" | "jobs";
const PREFIX: Record<DocTable, string> = {
  estimates: "EST",
  invoices: "INV",
  jobs: "JOB",
};
const NUMBER_COLUMN: Record<DocTable, string> = {
  estimates: "estimate_number",
  invoices: "invoice_number",
  jobs: "job_number",
};

/**
 * Generate the next sequential document number for a company, e.g.
 * EST-2026-0042. Derives the next sequence from the highest existing number for
 * the current year. Not strictly race-safe under heavy concurrency, but a unique
 * index on (company_id, number) makes a collision fail loudly rather than
 * silently duplicate; v1 traffic per company makes contention negligible.
 */
export async function nextDocumentNumber(
  supabase: SupabaseClient<Database>,
  table: DocTable,
  companyId: string,
  year = new Date().getFullYear()
): Promise<string> {
  const column = NUMBER_COLUMN[table];
  const prefix = PREFIX[table];
  const yearPrefix = `${prefix}-${year}-`;

  const { data } = await supabase
    .from(table)
    .select(column)
    .eq("company_id", companyId)
    .ilike(column, `${yearPrefix}%`)
    .order(column, { ascending: false })
    .limit(1)
    .maybeSingle();

  let next = 1;
  if (data) {
    const current = (data as unknown as Record<string, string>)[column];
    const seq = Number.parseInt(current.slice(yearPrefix.length), 10);
    if (!Number.isNaN(seq)) next = seq + 1;
  }

  return `${yearPrefix}${String(next).padStart(4, "0")}`;
}
