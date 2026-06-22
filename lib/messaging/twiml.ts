/**
 * Minimal TwiML builders for the AI voice receptionist (spec Module 2). We emit
 * XML directly rather than pulling in the Twilio SDK's builder so the response
 * path has no extra dependency and is trivial to read/test.
 */

export function escapeXml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function twiml(inner: string): Response {
  const xml = `<?xml version="1.0" encoding="UTF-8"?><Response>${inner}</Response>`;
  return new Response(xml, {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}

/** Say a line, then listen for speech and POST the result to `actionUrl`. */
export function sayAndGather(opts: {
  say: string;
  actionUrl: string;
  voice?: string;
  language?: string;
  /** Seconds of silence before Twilio gives up waiting. */
  timeout?: number;
}): Response {
  const voice = opts.voice ?? "Polly.Amy";
  const language = opts.language ?? "en-GB";
  return twiml(
    `<Gather input="speech" action="${escapeXml(opts.actionUrl)}" method="POST" speechTimeout="auto" timeout="${opts.timeout ?? 5}" language="${language}">` +
      `<Say voice="${voice}" language="${language}">${escapeXml(opts.say)}</Say>` +
      `</Gather>` +
      // Fallback if the caller says nothing: repeat the prompt once via redirect.
      `<Redirect method="POST">${escapeXml(opts.actionUrl)}</Redirect>`
  );
}

/** Say a final line and hang up. */
export function sayAndHangup(opts: {
  say: string;
  voice?: string;
  language?: string;
}): Response {
  const voice = opts.voice ?? "Polly.Amy";
  const language = opts.language ?? "en-GB";
  return twiml(
    `<Say voice="${voice}" language="${language}">${escapeXml(opts.say)}</Say><Hangup/>`
  );
}

/** Forward the call to a human number, with a brief message first. */
export function sayAndDial(opts: {
  say: string;
  dialNumber: string;
  voice?: string;
  language?: string;
}): Response {
  const voice = opts.voice ?? "Polly.Amy";
  const language = opts.language ?? "en-GB";
  return twiml(
    `<Say voice="${voice}" language="${language}">${escapeXml(opts.say)}</Say>` +
      `<Dial>${escapeXml(opts.dialNumber)}</Dial>`
  );
}
