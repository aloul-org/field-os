import { createAdminClient } from "@/lib/supabase/server";
import { publicEnv } from "@/lib/env";
import { sayAndGather, sayAndHangup } from "@/lib/messaging/twiml";
import {
  VOICE_PROMPTS,
  nextStep,
  summariseCall,
  appendTranscript,
  type VoiceStep,
} from "@/lib/messaging/voiceReceptionist";
import { createLeadWithScoring } from "@/lib/leads/createLead";
import {
  readTwilioForm,
  verifyTwilioSignature,
} from "@/lib/messaging/twilioSignature";

export const runtime = "nodejs";

/**
 * One turn of the voice receptionist conversation. Stores the caller's spoken
 * answer for the current slot, then either asks the next question or — when all
 * slots are filled — summarises the call, creates a scored lead, and hangs up.
 *
 * Slot state is carried across turns in the action URL query string (issue,
 * address) so the handler stays stateless; the running transcript is persisted
 * on the calls row.
 */
export async function POST(request: Request) {
  const url = new URL(request.url);
  const params = await readTwilioForm(request);
  const signature = request.headers.get("x-twilio-signature");
  if (!verifyTwilioSignature(request.url, params, signature)) {
    return new Response("Invalid signature", { status: 403 });
  }

  const step = (url.searchParams.get("step") ?? "issue") as VoiceStep;
  const speech = (params.SpeechResult ?? "").trim();
  const callSid = params.CallSid ?? "";
  const to = params.To ?? "";

  // Carried slots from previous turns.
  const issue = url.searchParams.get("issue") ?? "";
  const address = url.searchParams.get("address") ?? "";

  const admin = createAdminClient();
  const { data: company } = await admin
    .from("companies")
    .select("id, trade")
    .eq("twilio_voice_number", to)
    .maybeSingle();

  if (!company) {
    return sayAndHangup({ say: "Sorry, something went wrong. Goodbye." });
  }

  // Re-prompt once if Twilio redirected here with no speech captured.
  if (!speech) {
    const reAction = `${publicEnv.appUrl}/api/voice/gather?${url.searchParams.toString()}`;
    return sayAndGather({
      say: VOICE_PROMPTS[step as Exclude<VoiceStep, "done">] ?? VOICE_PROMPTS.issue,
      actionUrl: reAction,
    });
  }

  // Persist this answer onto the running transcript.
  const { data: call } = await admin
    .from("calls")
    .select("id, transcript")
    .eq("twilio_call_sid", callSid)
    .maybeSingle();

  const transcript = appendTranscript(call?.transcript ?? null, "Caller", speech);
  await admin
    .from("calls")
    .update({ transcript })
    .eq("twilio_call_sid", callSid);

  const upcoming = nextStep(step);

  if (upcoming !== "done") {
    // Ask the next question, carrying forward what we have.
    const carried = new URLSearchParams({ step: upcoming });
    if (step === "issue") carried.set("issue", speech);
    else carried.set("issue", issue);
    if (step === "address") carried.set("address", speech);
    else if (address) carried.set("address", address);

    return sayAndGather({
      say: VOICE_PROMPTS[upcoming as Exclude<VoiceStep, "done">],
      actionUrl: `${publicEnv.appUrl}/api/voice/gather?${carried.toString()}`,
    });
  }

  // Final slot (urgency) just answered → summarise + create the lead.
  const finalIssue = issue || speech;
  const finalAddress = address;
  const urgencyText = speech;

  let summary = `Issue: ${finalIssue}. Address: ${finalAddress}. Urgency: ${urgencyText}.`;
  let urgency: "emergency" | "urgent" | "normal" | "flexible" = "normal";
  let jobDescription = finalIssue;
  try {
    const result = await summariseCall({
      trade: company.trade,
      issue: finalIssue,
      address: finalAddress,
      urgency: urgencyText,
    });
    summary = result.summary;
    urgency = result.urgency;
    jobDescription = result.job_description;
  } catch {
    // keep fallback values
  }

  const lead = await createLeadWithScoring(
    admin,
    {
      company_id: company.id,
      source: "phone_call",
      contact_phone: params.From ?? null,
      job_description: jobDescription,
      raw_message: summary,
      address: finalAddress || null,
    },
    company.trade
  );

  await admin
    .from("calls")
    .update({
      status: "completed",
      ended_at: new Date().toISOString(),
      ai_summary: summary,
      urgency,
      lead_id: lead?.id ?? null,
    })
    .eq("twilio_call_sid", callSid);

  return sayAndHangup({
    say: "Thank you — I've passed your details to the team and someone will be in touch shortly. Goodbye.",
  });
}
