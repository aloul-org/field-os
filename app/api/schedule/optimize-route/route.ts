import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { getRouteContext } from "@/lib/auth/session";
import { ok, err, unauthorized, forbidden, parseBody } from "@/lib/api/response";
import { optimizeRoute, type RouteStop } from "@/lib/maps/routes";

export const runtime = "nodejs";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const bodySchema = z.object({
  technician_id: z.string().uuid(),
  date: z.string().regex(DATE_RE),
});

/**
 * Optimise a technician's day for minimum drive time (spec Module 3). Loads their
 * appointments for the day, reorders via the Google Routes API, and writes back
 * route_order + travel_time_minutes_from_previous on each appointment.
 */
export async function POST(request: Request) {
  const auth = await getRouteContext("schedule");
  if ("error" in auth) {
    return auth.error === "unauthorized" ? unauthorized() : forbidden();
  }
  const ctx = auth.ctx;

  const { data: body, error } = await parseBody(request, bodySchema);
  if (error) return error;

  const supabase = createClient();
  const dayStart = new Date(`${body.date}T00:00:00.000Z`).toISOString();
  const dayEnd = new Date(`${body.date}T23:59:59.999Z`).toISOString();

  const { data: appts } = await supabase
    .from("appointments")
    .select("id, scheduled_start, jobs(properties(lat, lng))")
    .eq("company_id", ctx.company.id)
    .eq("assigned_technician_id", body.technician_id)
    .gte("scheduled_start", dayStart)
    .lte("scheduled_start", dayEnd)
    .neq("status", "cancelled")
    .order("scheduled_start");

  const stops: RouteStop[] = [];
  for (const a of appts ?? []) {
    const job = a.jobs as unknown as { properties: { lat: number | null; lng: number | null } | null } | null;
    const prop = job?.properties;
    if (prop?.lat != null && prop?.lng != null) {
      stops.push({ id: a.id, lat: prop.lat, lng: prop.lng });
    }
  }

  if (stops.length < 3) {
    return err(
      "Need at least 3 stops with addresses on the map to optimise a route.",
      400
    );
  }

  const optimized = await optimizeRoute(stops);
  if (!optimized) {
    return err(
      "Route optimisation isn't available right now (check the Google Maps key).",
      503
    );
  }

  // Persist the new order + drive times.
  await Promise.all(
    optimized.map((s) =>
      supabase
        .from("appointments")
        .update({
          route_order: s.route_order,
          travel_time_minutes_from_previous: s.travel_time_minutes_from_previous,
        })
        .eq("id", s.id)
        .eq("company_id", ctx.company.id)
    )
  );

  return ok({ stops: optimized.length });
}
