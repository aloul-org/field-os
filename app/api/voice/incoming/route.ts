import { createAdminClient } from "@/lib/supabase/server";
import { publicEnv } from "@/lib/env";
import { sayAndGather, sayAndHangup, sayAndDial } from "@/lib/messaging/twiml";
import { VOICE_PROMPTS } from "@/lib/messaging/voiceReceptionist";
import {
  readTwilioForm,
  verifyTwilioSignature,
} from "@/lib/messaging/twilioSignature";

export const runtime = "nodejs";

/**
 * Twilio Voice webhook for an inbound call (spec Module 2). Identifies the
 * company by the dialled number, greets the caller, and starts the slot-filling
 * conversation. The conversation continues in /api/voice/gather.
 */
export async function POST(request: Request) {
  const params = await readTwilioForm(request);
  const signature = request.headers.get("x-twilio-signature");
  if (!verifyTwilioSignature(request.url, params, signature)) {
    return new Response("Invalid signature", { status: 403 });
  }

  const to = params.To ?? "";
  const from = params.From ?? "";
  const callSid = params.CallSid ?? "";

  const admin = createAdminClient();
  const { data: company } = await admin
    .from("companies")
    .select("id, business_name, phone, voice_receptionist_enabled, voice_greeting")
    .eq("twilio_voice_number", to)
    .maybeSingle();

  // No company / receptionist off → forward to the human line if we have one.
  if (!company || !company.voice_receptionist_enabled) {
    if (company?.phone) {
      return sayAndDial({
        say: "Please hold while we connect you.",
        dialNumber: company.phone,
      });
    }
    return sayAndHangup({
      say: "Sorry, no one is available to take your call right now. Please try again later.",
    });
  }

  // Log the call (idempotent on the unique twilio_call_sid).
  await admin.from("calls").upsert(
    {
      company_id: company.id,
      twilio_call_sid: callSid,
      caller_number: from,
      direction: "inbound",
      status: "in_progress",
      started_at: new Date().toISOString(),
    },
    { onConflict: "twilio_call_sid" }
  );

  const greeting =
    company.voice_greeting?.trim() ||
    `Thank you for calling ${company.business_name}.`;

  const action = `${publicEnv.appUrl}/api/voice/gather?step=issue`;
  return sayAndGather({
    say: `${greeting} ${VOICE_PROMPTS.issue}`,
    actionUrl: action,
  });
}
