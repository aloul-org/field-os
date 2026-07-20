import type { SupabaseClient } from "@supabase/supabase-js";

import type { ActiveContext } from "@/lib/auth/session";
import { publicEnv } from "@/lib/env";
import { sendEmail } from "@/lib/messaging/email";
import type { Database } from "@/lib/types/database";

type Client = SupabaseClient<Database>;

export type SendEstimateResult =
  | { ok: true; url: string; emailed: boolean }
  | { ok: false; error: string };

/**
 * Flips a draft estimate to "sent" and best-effort emails the customer an
 * acceptance link. Shared by the web server action
 * (app/(app)/estimates/actions.ts) and the mobile Bearer route
 * (/api/estimate/send) so the two can't drift.
 */
export async function sendEstimateCore(
  supabase: Client,
  ctx: ActiveContext,
  estimateId: string
): Promise<SendEstimateResult> {
  const { data: estimate, error } = await supabase
    .from("estimates")
    .select(
      "id, status, acceptance_token, job_title, total_inc_vat, customer_id, sent_at"
    )
    .eq("id", estimateId)
    .eq("company_id", ctx.company.id)
    .maybeSingle();

  if (error || !estimate) return { ok: false, error: "Estimate not found." };

  const { error: updateError } = await supabase
    .from("estimates")
    .update({
      status: "sent",
      sent_at: estimate.sent_at ?? new Date().toISOString(),
    })
    .eq("id", estimateId)
    .eq("company_id", ctx.company.id);

  if (updateError) return { ok: false, error: "Could not send the estimate." };

  const url = `${publicEnv.appUrl}/quote/${estimate.acceptance_token}`;

  let emailed = false;
  if (estimate.customer_id) {
    const { data: customer } = await supabase
      .from("customers")
      .select("email, name")
      .eq("id", estimate.customer_id)
      .maybeSingle();
    if (customer?.email) {
      const res = await sendEmail({
        to: customer.email,
        subject: `Your quote from ${ctx.company.business_name}`,
        html: `<p>Hi ${customer.name},</p><p>${ctx.company.business_name} has sent you a quote for "${estimate.job_title}".</p><p><a href="${url}">View and accept your quote</a></p>`,
      });
      emailed = res.ok;
    }
  }

  return { ok: true, url, emailed };
}
