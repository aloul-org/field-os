/**
 * Centralised, typed environment access.
 *
 * Public vars (NEXT_PUBLIC_*) are inlined by Next at build time and safe in the
 * browser. Server-only secrets are read lazily through `serverEnv()` so that a
 * missing key throws a clear error at the point of use (e.g. when a Stripe route
 * runs without STRIPE_SECRET_KEY) rather than crashing the whole app at import.
 */

export const publicEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "FieldOS AI",
  stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
  mapboxToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "",
} as const;

type ServerEnvKey =
  | "ANTHROPIC_API_KEY"
  | "OPENAI_API_KEY"
  | "SUPABASE_SERVICE_ROLE_KEY"
  | "STRIPE_SECRET_KEY"
  | "STRIPE_WEBHOOK_SECRET"
  | "STRIPE_PRICE_ID_STARTER"
  | "STRIPE_PRICE_ID_GROWTH"
  | "STRIPE_PRICE_ID_PRO"
  | "STRIPE_CONNECT_CLIENT_ID"
  | "TWILIO_ACCOUNT_SID"
  | "TWILIO_AUTH_TOKEN"
  | "TWILIO_WHATSAPP_FROM"
  | "TWILIO_SMS_FROM"
  | "RESEND_API_KEY"
  | "RESEND_FROM_EMAIL"
  | "GOOGLE_MAPS_SERVER_KEY"
  | "CRON_SECRET";

/**
 * Read a required server-only env var, throwing a descriptive error if unset.
 * Never call this in code that runs in the browser.
 */
export function serverEnv(key: ServerEnvKey): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}. Add it to your .env.local (see .env.example).`
    );
  }
  return value;
}

/** Read an optional server-only env var, returning undefined if unset. */
export function optionalServerEnv(key: ServerEnvKey): string | undefined {
  return process.env[key] || undefined;
}
