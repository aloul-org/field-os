import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { getRouteContext } from "@/lib/auth/session";
import { ok, err, unauthorized, forbidden, parseBody } from "@/lib/api/response";

export const runtime = "nodejs";

const bodySchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

/**
 * Technician location ping (spec Module 3). Called ~every 60s by the tech app
 * ONLY while the app is open and the technician has explicitly opted in — never
 * background tracking. Updates the technician's last-known position for the live
 * dispatch board.
 */
export async function PATCH(request: Request) {
  const auth = await getRouteContext();
  if ("error" in auth) {
    return auth.error === "unauthorized" ? unauthorized() : forbidden();
  }
  const ctx = auth.ctx;
  if (ctx.role !== "technician") return forbidden();

  const { data: body, error } = await parseBody(request, bodySchema);
  if (error) return error;

  const supabase = createClient();
  const { error: updateError } = await supabase
    .from("team_members")
    .update({
      last_known_lat: body.lat,
      last_known_lng: body.lng,
      last_location_at: new Date().toISOString(),
    })
    .eq("id", ctx.member.id)
    .eq("company_id", ctx.company.id);

  if (updateError) return err("Couldn't update location.", 500);
  return ok({ updated: true });
}
