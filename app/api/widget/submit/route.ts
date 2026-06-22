import { createAdminClient } from "@/lib/supabase/server";
import { ok, err, parseBody } from "@/lib/api/response";
import { widgetSubmitSchema } from "@/lib/validations/lead";
import { createLeadWithScoring } from "@/lib/leads/createLead";
import { checkRateLimit } from "@/lib/api/rateLimit";

export const runtime = "nodejs";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

/**
 * Public website-widget submission (spec Module 2). No auth — the
 * widget_public_key identifies the company; a honeypot field + per-IP rate
 * limit guard against bots. Uses the admin client since the visitor is anonymous.
 */
export async function POST(request: Request) {
  const { data: body, error } = await parseBody(request, widgetSubmitSchema);
  if (error) {
    return withCors(err("Please check the form and try again.", 422));
  }

  // Honeypot: a populated hidden field means it's a bot — accept silently.
  if (body.company_website) return withCors(ok({ received: true }));

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(`widget:${ip}`, 5, 60_000)) {
    return withCors(err("Too many requests — please wait a moment.", 429));
  }

  const admin = createAdminClient();

  const { data: company } = await admin
    .from("companies")
    .select("id, trade, widget_enabled")
    .eq("widget_public_key", body.widget_public_key)
    .maybeSingle();

  if (!company || !company.widget_enabled) {
    return withCors(err("This form is not currently accepting submissions.", 403));
  }

  const result = await createLeadWithScoring(
    admin,
    {
      company_id: company.id,
      source: "website_widget",
      contact_name: body.contact_name,
      contact_phone: body.contact_phone ?? null,
      contact_email: body.contact_email ?? null,
      job_description: body.message,
      raw_message: body.message,
      address: body.address ?? null,
    },
    company.trade
  );

  if (!result) {
    return withCors(err("Something went wrong. Please try again.", 500));
  }

  return withCors(ok({ received: true }));
}

function withCors(res: Response): Response {
  for (const [k, v] of Object.entries(CORS)) res.headers.set(k, v);
  return res;
}
