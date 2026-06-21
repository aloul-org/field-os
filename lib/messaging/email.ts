import { optionalServerEnv } from "@/lib/env";

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

/**
 * Send a transactional email via Resend. If RESEND_API_KEY isn't configured the
 * call is a graceful no-op (returns ok:false) so callers can degrade to "copy
 * the link" rather than crash — Resend is only required once email is wired up.
 */
export async function sendEmail(
  input: SendEmailInput
): Promise<{ ok: boolean; skipped?: boolean }> {
  const apiKey = optionalServerEnv("RESEND_API_KEY");
  const from = optionalServerEnv("RESEND_FROM_EMAIL") ?? "hello@fieldos.ai";
  if (!apiKey) return { ok: false, skipped: true };

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      replyTo: input.replyTo,
    });
    return { ok: !error };
  } catch {
    return { ok: false };
  }
}
