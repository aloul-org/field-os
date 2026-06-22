import { optionalServerEnv } from "@/lib/env";

type Channel = "sms" | "whatsapp";

/**
 * Send an SMS or WhatsApp message via Twilio. Graceful no-op (returns ok:false,
 * skipped:true) when Twilio isn't configured, so callers degrade rather than
 * crash — mirrors the email helper's behaviour.
 */
export async function sendMessage(opts: {
  to: string;
  body: string;
  channel: Channel;
}): Promise<{ ok: boolean; skipped?: boolean }> {
  const sid = optionalServerEnv("TWILIO_ACCOUNT_SID");
  const token = optionalServerEnv("TWILIO_AUTH_TOKEN");
  const from =
    opts.channel === "whatsapp"
      ? optionalServerEnv("TWILIO_WHATSAPP_FROM")
      : optionalServerEnv("TWILIO_SMS_FROM");

  if (!sid || !token || !from) return { ok: false, skipped: true };

  const to = opts.channel === "whatsapp" ? `whatsapp:${opts.to}` : opts.to;
  const fromAddr = opts.channel === "whatsapp" && !from.startsWith("whatsapp:")
    ? `whatsapp:${from}`
    : from;

  try {
    const { default: twilio } = await import("twilio");
    const client = twilio(sid, token);
    await client.messages.create({ to, from: fromAddr, body: opts.body });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
