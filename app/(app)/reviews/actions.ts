"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { requireSection } from "@/lib/auth/session";
import { canWrite } from "@/lib/auth/roles";
import { sendMessage } from "@/lib/messaging/sms";
import { sendEmail } from "@/lib/messaging/email";

type Result<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const WRITE_DENIED = "You don't have permission to make changes.";

/** Send a review request for a completed/paid job via the customer's best channel. */
export async function sendReviewRequest(jobId: string): Promise<Result> {
  const ctx = await requireSection("reviews");
  if (!canWrite(ctx.role)) return { ok: false, error: WRITE_DENIED };

  if (!ctx.company.google_business_profile_url) {
    return {
      ok: false,
      error: "Add your Google review link in Settings first so customers can leave a review.",
    };
  }

  const supabase = createClient();
  const { data: job } = await supabase
    .from("jobs")
    .select("id, customer_id, customers(name, phone, email)")
    .eq("id", jobId)
    .eq("company_id", ctx.company.id)
    .maybeSingle();
  if (!job) return { ok: false, error: "Job not found." };

  const customer = job.customers as unknown as
    | { name: string; phone: string | null; email: string | null }
    | null;
  if (!customer) return { ok: false, error: "This job has no customer on file." };

  const link = ctx.company.google_business_profile_url;
  const body = `Hi ${customer.name}, thanks for choosing ${ctx.company.business_name}! If you were happy with the work, we'd really appreciate a quick review: ${link}`;

  // Prefer WhatsApp, then SMS, then email — first that has an address/succeeds.
  let channel: "whatsapp" | "sms" | "email" | null = null;
  if (customer.phone) {
    const wa = await sendMessage({ to: customer.phone, body, channel: "whatsapp" });
    if (wa.ok) channel = "whatsapp";
    if (!channel) {
      const sms = await sendMessage({ to: customer.phone, body, channel: "sms" });
      if (sms.ok) channel = "sms";
    }
  }
  if (!channel && customer.email) {
    const em = await sendEmail({
      to: customer.email,
      subject: `How did we do? — ${ctx.company.business_name}`,
      html: `<p>Hi ${customer.name},</p><p>Thanks for choosing ${ctx.company.business_name}! If you were happy with the work, we'd really appreciate a quick review:</p><p><a href="${link}">Leave a review</a></p>`,
    });
    if (em.ok) channel = "email";
  }

  // Record the request even if delivery channels weren't configured — the office
  // can follow up manually; channel falls back to the customer's best contact.
  const recordedChannel = channel ?? (customer.phone ? "sms" : "email");
  await supabase.from("review_requests").insert({
    company_id: ctx.company.id,
    customer_id: job.customer_id,
    job_id: job.id,
    channel: recordedChannel,
    status: channel ? "sent" : "pending",
  });

  revalidatePath("/reviews");
  if (!channel) {
    return {
      ok: false,
      error: "Saved the request, but couldn't send it automatically — no messaging is configured yet.",
    };
  }
  return { ok: true, data: undefined };
}

const badReviewSchema = z.object({
  customerId: z.string().uuid(),
  note: z.string().trim().min(1, "Add a short note").max(500),
});

/**
 * Recovery flow (spec Module 11): log a poor review, flag the customer, draft an
 * outreach message and notify the office to follow up personally.
 */
export async function logBadReview(input: {
  customerId: string;
  note: string;
}): Promise<Result<{ draft: string }>> {
  const ctx = await requireSection("reviews");
  if (!canWrite(ctx.role)) return { ok: false, error: WRITE_DENIED };

  const parsed = badReviewSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid request." };
  }
  const { customerId, note } = parsed.data;

  const supabase = createClient();
  const { data: customer } = await supabase
    .from("customers")
    .select("id, name, notes")
    .eq("id", customerId)
    .eq("company_id", ctx.company.id)
    .maybeSingle();
  if (!customer) return { ok: false, error: "Customer not found." };

  await supabase.from("review_requests").insert({
    company_id: ctx.company.id,
    customer_id: customerId,
    channel: "email",
    status: "recovery",
  });

  // Flag on the customer profile.
  const flag = `⚠️ Review recovery (${new Date().toISOString().slice(0, 10)}): ${note}`;
  await supabase
    .from("customers")
    .update({ notes: customer.notes ? `${flag}\n\n${customer.notes}` : flag })
    .eq("id", customerId)
    .eq("company_id", ctx.company.id);

  await supabase.from("notifications").insert({
    company_id: ctx.company.id,
    user_id: null,
    type: "review_recovery",
    title: "Review recovery needed",
    body: `${customer.name} left negative feedback — reach out personally.`,
    link: `/customers/${customerId}`,
  });

  const draft = `Hi ${customer.name}, this is ${ctx.company.business_name}. I'm sorry to hear the recent work didn't meet your expectations. I'd really like to put it right — would you have a few minutes to tell me what went wrong so we can fix it?`;

  revalidatePath("/reviews");
  return { ok: true, data: { draft } };
}
