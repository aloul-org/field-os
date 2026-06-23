import { optionalServerEnv } from "@/lib/env";

export interface RouteStop {
  id: string;
  lat: number;
  lng: number;
}

export interface OptimizedStop {
  id: string;
  route_order: number;
  travel_time_minutes_from_previous: number | null;
}

/** Parse a Routes API duration string like "1234s" into whole minutes. */
function durationToMinutes(d: string | undefined): number | null {
  if (!d) return null;
  const seconds = Number.parseInt(d.replace("s", ""), 10);
  return Number.isNaN(seconds) ? null : Math.round(seconds / 60);
}

/**
 * Optimise a technician's day of stops for minimum total drive time using the
 * Google Routes API (`computeRoutes` with optimizeWaypointOrder, spec Module 3).
 * Models the day as a round trip anchored on the first stop. Returns the reordered
 * stops with per-leg drive times, or null when no key is set / too few stops /
 * the call fails — callers keep the manual order in that case.
 */
export async function optimizeRoute(stops: RouteStop[]): Promise<OptimizedStop[] | null> {
  const key = optionalServerEnv("GOOGLE_MAPS_SERVER_KEY");
  if (!key || stops.length < 3) return null; // nothing to optimise

  const anchor = stops[0];
  const intermediates = stops.slice(1);
  const waypoint = (s: RouteStop) => ({
    location: { latLng: { latitude: s.lat, longitude: s.lng } },
  });

  try {
    const res = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask":
          "routes.optimizedIntermediateWaypointIndex,routes.legs.duration",
      },
      body: JSON.stringify({
        origin: waypoint(anchor),
        destination: waypoint(anchor),
        intermediates: intermediates.map(waypoint),
        travelMode: "DRIVE",
        optimizeWaypointOrder: true,
      }),
      cache: "no-store",
    });
    if (!res.ok) return null;

    const data = (await res.json()) as {
      routes?: {
        optimizedIntermediateWaypointIndex?: number[];
        legs?: { duration?: string }[];
      }[];
    };
    const route = data.routes?.[0];
    const order = route?.optimizedIntermediateWaypointIndex;
    const legs = route?.legs ?? [];
    if (!order) return null;

    // Visiting order: anchor first, then intermediates in the optimised order.
    const ordered: RouteStop[] = [anchor, ...order.map((i) => intermediates[i])];
    return ordered.map((s, idx) => ({
      id: s.id,
      route_order: idx + 1,
      // leg[k-1] is the drive into the k-th stop; the anchor has no inbound leg.
      travel_time_minutes_from_previous: idx === 0 ? null : durationToMinutes(legs[idx - 1]?.duration),
    }));
  } catch {
    return null;
  }
}
