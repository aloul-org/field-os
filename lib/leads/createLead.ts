import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, LeadSource } from "@/lib/types/database";
import { scoreLead } from "@/lib/ai/leadScoring";

export interface NewLeadInput {
  company_id: string;
  source: LeadSource;
  contact_name?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  raw_message?: string | null;
  job_description?: string | null;
  address?: string | null;
  customer_id?: string | null;
}

/**
 * Insert a lead, score it with AI (best-effort), and notify the owner for
 * hot/warm leads (spec Module 2). Cold leads are intentionally NOT notified
 * immediately — they're left for the daily digest cron.
 *
 * Works with either the RLS client (manual entry by a logged-in user) or the
 * admin client (public webhooks: widget, voice, WhatsApp/SMS). The caller is
 * responsible for having already authorised writing to `company_id`.
 *
 * Scoring runs inline rather than via jobs_queue: lead volume is low enough that
 * the few-hundred-ms haiku call is acceptable, and it means the score is present
 * the first time the owner opens the inbox. Failures degrade to an unscored lead.
 */
export async function createLeadWithScoring(
  supabase: SupabaseClient<Database>,
  input: NewLeadInput,
  trade: string
): Promise<{ id: string } | null> {
  const { data: lead, error } = await supabase
    .from("leads")
    .insert({
      company_id: input.company_id,
      source: input.source,
      customer_id: input.customer_id ?? null,
      contact_name: input.contact_name ?? null,
      contact_phone: input.contact_phone ?? null,
      contact_email: input.contact_email ?? null,
      raw_message: input.raw_message ?? null,
      job_description: input.job_description ?? null,
      address: input.address ?? null,
      status: "new",
    })
    .select("id")
    .single();

  if (error || !lead) return null;

  const message = [input.job_description, input.raw_message]
    .filter(Boolean)
    .join("\n")
    .trim();

  if (message) {
    try {
      const result = await scoreLead({ trade, message });
      await supabase
        .from("leads")
        .update({ score: result.score, score_reason: result.reason })
        .eq("id", lead.id);

      if (result.score === "hot" || result.score === "warm") {
        const who = input.contact_name ?? "New enquiry";
        await supabase.from("notifications").insert({
          company_id: input.company_id,
          user_id: null,
          type: "lead_received",
          title: result.score === "hot" ? "🔥 Hot lead" : "New lead",
          body: `${who}: ${result.reason}`,
          link: `/leads/${lead.id}`,
        });
      }
    } catch {
      // Leave the lead unscored — scoring is best-effort.
    }
  }

  return { id: lead.id };
}
