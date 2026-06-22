import { createClient } from "@/lib/supabase/server";
import { getRouteContext } from "@/lib/auth/session";
import { ok, err, unauthorized, forbidden } from "@/lib/api/response";
import { transcribeAudio } from "@/lib/ai/whisper";
import { runTextPrompt, MODELS } from "@/lib/ai/anthropic";

export const runtime = "nodejs";

const FORMAT_SYSTEM = `You are converting a tradesperson's spoken, informal job-completion note into a professional, concise job report for the customer file. Keep all factual content (parts used, work performed, any issues found or recommended follow-up). Remove filler words and informal language. Write in third person, past tense. Keep it under 100 words unless the original note genuinely requires more detail.`;

/**
 * Technician job report (spec Module 4). Accepts either recorded audio (Whisper
 * → AI format) or a typed note (AI format only). Persists the raw transcript and
 * the cleaned report on job_reports, never discarding the raw text.
 */
export async function POST(request: Request) {
  const auth = await getRouteContext();
  if ("error" in auth) {
    return auth.error === "unauthorized" ? unauthorized() : forbidden();
  }
  const ctx = auth.ctx;
  if (ctx.role !== "technician") return forbidden();

  const form = await request.formData();
  const jobId = String(form.get("jobId") ?? "");
  const audio = form.get("audio");
  const typed = form.get("text");
  if (!jobId) return err("Missing job.", 400);

  const supabase = createClient();
  const { data: appt } = await supabase
    .from("appointments")
    .select("id")
    .eq("job_id", jobId)
    .eq("assigned_technician_id", ctx.member.id)
    .limit(1)
    .maybeSingle();
  if (!appt) return forbidden("This job isn't assigned to you.");

  // Resolve the raw transcript from audio or the typed fallback.
  let transcript: string | null = null;
  if (audio instanceof Blob && audio.size > 0) {
    transcript = await transcribeAudio(audio);
    if (!transcript) {
      return err(
        "Voice transcription isn't available right now — please type the report.",
        503
      );
    }
  } else if (typeof typed === "string" && typed.trim()) {
    transcript = typed.trim();
  } else {
    return err("Nothing to save.", 400);
  }

  // Format into a clean report (best-effort — fall back to the raw transcript).
  let formatted = transcript;
  try {
    formatted = await runTextPrompt({
      model: MODELS.background,
      system: FORMAT_SYSTEM,
      messages: [{ role: "user", content: transcript }],
      maxTokens: 400,
    });
  } catch {
    // keep the raw transcript as the report
  }

  const { data: existing } = await supabase
    .from("job_reports")
    .select("id")
    .eq("job_id", jobId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("job_reports")
      .update({ voice_transcript: transcript, ai_formatted_report: formatted })
      .eq("id", existing.id);
  } else {
    await supabase.from("job_reports").insert({
      job_id: jobId,
      technician_id: ctx.member.id,
      voice_transcript: transcript,
      ai_formatted_report: formatted,
    });
  }

  return ok({ report: formatted, transcript });
}
