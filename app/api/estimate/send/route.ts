import { getRouteContext } from "@/lib/auth/session";
import { canWrite } from "@/lib/auth/roles";
import { ok, err, forbidden, unauthorized, parseBody } from "@/lib/api/response";
import { sendEstimateCore } from "@/lib/estimates/send-estimate";
import { z } from "zod";

export const runtime = "nodejs";

const bodySchema = z.object({ id: z.string().uuid() });

/** Mobile counterpart of the web's sendEstimate server action. */
export async function POST(request: Request) {
  const auth = await getRouteContext("estimates", request);
  if ("error" in auth) {
    return auth.error === "unauthorized" ? unauthorized() : forbidden();
  }
  const { ctx, supabase } = auth;
  if (!canWrite(ctx.role)) {
    return forbidden("You don't have permission to make changes.");
  }

  const { data: body, error } = await parseBody(request, bodySchema);
  if (error) return error;

  const result = await sendEstimateCore(supabase, ctx, body.id);
  if (!result.ok) return err(result.error, 400);
  return ok({ url: result.url, emailed: result.emailed });
}
