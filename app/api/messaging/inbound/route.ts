import { createAdminClient } from "@/lib/supabase/server";
import { createLeadWithScoring } from "@/lib/leads/createLead";
import {
  readTwilioForm,
  verifyTwilioSignature,
} from "@/lib/messaging/twilioSignature";

export const runtime = "nodejs";

/** Empty TwiML ack — we handle the message async, no auto-reply in v1. */
function ack(): Response {
  return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}

/** Strip Twilio's channel prefix, e.g. "whatsapp:+44..." → "+44...". */
function normaliseNumber(raw: string): { number: string; isWhatsApp: boolean } {
  const isWhatsApp = raw.startsWith("whatsapp:");
  return { number: raw.replace(/^whatsapp:/, ""), isWhatsApp };
}

/**
 * Inbound WhatsApp/SMS webhook (spec Module 2). Matches the company by the
 * number that was messaged, links the message to an existing customer by phone
 * when possible, and creates a scored lead.
 */
export async function POST(request: Request) {
  const params = await readTwilioForm(request);
  const signature = request.headers.get("x-twilio-signature");
  if (!verifyTwilioSignature(request.url, params, signature)) {
    return new Response("Invalid signature", { status: 403 });
  }

  const from = normaliseNumber(params.From ?? "");
  const to = normaliseNumber(params.To ?? "");
  const body = (params.Body ?? "").trim();
  if (!body) return ack();

  const admin = createAdminClient();
  const { data: company } = await admin
    .from("companies")
    .select("id, trade")
    .eq("twilio_voice_number", to.number)
    .maybeSingle();

  if (!company) return ack();

  // Link to an existing customer if this number is already on file.
  const { data: customer } = await admin
    .from("customers")
    .select("id, name")
    .eq("company_id", company.id)
    .eq("phone", from.number)
    .maybeSingle();

  await createLeadWithScoring(
    admin,
    {
      company_id: company.id,
      source: from.isWhatsApp ? "whatsapp" : "sms",
      customer_id: customer?.id ?? null,
      contact_name: customer?.name ?? null,
      contact_phone: from.number,
      job_description: body,
      raw_message: body,
    },
    company.trade
  );

  return ack();
}
