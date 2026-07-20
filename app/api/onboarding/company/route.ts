import { createClient, createBearerClient } from "@/lib/supabase/server";
import { ok, err, unauthorized, parseBody } from "@/lib/api/response";
import { createCompanyCore } from "@/lib/onboarding/create-company";
import { createCompanySchema } from "@/lib/validations/onboarding";

export const runtime = "nodejs";

/**
 * Mobile counterpart of the onboarding createCompanyAction. Can't go through
 * getRouteContext — that requires an existing membership, and this endpoint
 * exists precisely because the user doesn't have one yet. Bearer JWT (mobile)
 * or cookie session (web) both work.
 */
export async function POST(request: Request) {
  const token = request.headers
    .get("authorization")
    ?.match(/^Bearer\s+(.+)$/i)?.[1];
  const supabase = token ? createBearerClient(token) : createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  const { data: body, error } = await parseBody(request, createCompanySchema);
  if (error) return error;

  const result = await createCompanyCore(supabase, user, body);
  if (!result.ok) return err(result.error, 400);
  return ok({ companyId: result.companyId });
}
