import { createAdminClient } from "@/lib/supabase/server";
import { optionalServerEnv } from "@/lib/env";
import { ok, err } from "@/lib/api/response";
import { sendMessage } from "@/lib/messaging/sms";
import { sendEmail } from "@/lib/messaging/email";

export const runtime = "nodejs";

/**
 * Daily renewal reminder cron (spec Module 10). Finds active renewal plans due
 * within 14 days and messages the customer. Does NOT advance next_due_date here —
 * that happens when the resulting job completes. Gate with CRON_SECRET.
 *
 * Schedule via Vercel Cron (vercel.json) or any scheduler hitting this URL with
 * `Authorization: Bearer $CRON_SECRET`.
 */
export async function POST(request: Request) {
  const secret = optionalServerEnv("CRON_SECRET");
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) return err("Unauthorized", 401);
  }

  const admin = createAdminClient();
  const horizon = new Date(Date.now() + 14 * 86400_000).toISOString().slice(0, 10);

  const { data: due } = await admin
    .from("renewal_plans")
    .select(
      "id, plan_type, next_due_date, customer_id, customers(name, phone, email), companies(business_name)"
    )
    .eq("status", "active")
    .lte("next_due_date", horizon);

  let sent = 0;
  for (const plan of due ?? []) {
    const customer = plan.customers as unknown as
      | { name: string; phone: string | null; email: string | null }
      | null;
    const company = plan.companies as unknown as { business_name: string } | null;
    if (!customer || !company) continue;

    const body = `Hi ${customer.name}, your ${plan.plan_type} with ${company.business_name} is due soon (${plan.next_due_date}). Reply to book it in.`;

    let delivered = false;
    if (customer.phone) {
      const wa = await sendMessage({ to: customer.phone, body, channel: "whatsapp" });
      delivered = wa.ok || (await sendMessage({ to: customer.phone, body, channel: "sms" })).ok;
    }
    if (!delivered && customer.email) {
      const em = await sendEmail({
        to: customer.email,
        subject: `${plan.plan_type} due soon — ${company.business_name}`,
        html: `<p>Hi ${customer.name},</p><p>Your ${plan.plan_type} with ${company.business_name} is due soon (${plan.next_due_date}). Reply to book it in.</p>`,
      });
      delivered = em.ok;
    }
    if (delivered) sent += 1;
  }

  return ok({ checked: due?.length ?? 0, sent });
}
