import { optionalServerEnv } from "@/lib/env";

/**
 * Transcribe audio with OpenAI Whisper (spec: voice transcription provider).
 * Returns null when no key is configured so callers can fall back to a typed
 * note rather than failing. Sends the raw audio Blob via multipart.
 */
export async function transcribeAudio(audio: Blob): Promise<string | null> {
  const key = optionalServerEnv("OPENAI_API_KEY");
  if (!key) return null;

  const form = new FormData();
  form.set("file", audio, "audio.webm");
  form.set("model", "whisper-1");

  try {
    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
      body: form,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { text?: string };
    return data.text?.trim() || null;
  } catch {
    return null;
  }
}
