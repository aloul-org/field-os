import { createAdminClient } from "@/lib/supabase/server";
import { ok, err } from "@/lib/api/response";

export const runtime = "nodejs";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Public config the widget reads to render itself (company name, on/off). */
export async function GET(
  _request: Request,
  { params }: { params: { widgetKey: string } }
) {
  if (!UUID_RE.test(params.widgetKey)) {
    return withCors(err("Invalid widget key", 400));
  }

  const admin = createAdminClient();
  const { data: company } = await admin
    .from("companies")
    .select("business_name, widget_enabled")
    .eq("widget_public_key", params.widgetKey)
    .maybeSingle();

  if (!company || !company.widget_enabled) {
    return withCors(err("Widget not found or disabled", 404));
  }

  return withCors(
    ok({ business_name: company.business_name, enabled: true })
  );
}

function withCors(res: Response): Response {
  for (const [k, v] of Object.entries(CORS)) res.headers.set(k, v);
  return res;
}
