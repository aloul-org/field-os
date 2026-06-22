import { validateRequest } from "twilio";

import { optionalServerEnv } from "@/lib/env";

/**
 * Verify an inbound Twilio webhook signature. Returns true when valid OR when no
 * auth token is configured (dev/preview environments without Twilio set up) so
 * local testing isn't blocked. In production with TWILIO_AUTH_TOKEN set, an
 * invalid signature is rejected.
 */
export function verifyTwilioSignature(
  url: string,
  params: Record<string, string>,
  signature: string | null
): boolean {
  const token = optionalServerEnv("TWILIO_AUTH_TOKEN");
  if (!token) return true; // not configured — allow (dev)
  if (!signature) return false;
  try {
    return validateRequest(token, signature, url, params);
  } catch {
    return false;
  }
}

/** Read a Twilio x-www-form-urlencoded webhook body into a flat string map. */
export async function readTwilioForm(
  request: Request
): Promise<Record<string, string>> {
  const form = await request.formData();
  const out: Record<string, string> = {};
  form.forEach((v, k) => {
    out[k] = typeof v === "string" ? v : "";
  });
  return out;
}
