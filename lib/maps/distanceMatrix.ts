import { optionalServerEnv } from "@/lib/env";

export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * Travel time (minutes) from origin to destination via the Google Distance
 * Matrix API. Returns null when no key is configured or the call fails, so the
 * scheduler degrades gracefully to a no-travel-penalty estimate rather than
 * breaking. Deliberate v1 behaviour — see lib/scheduling/autoSchedule.ts.
 */
export async function travelTimeMinutes(
  origin: LatLng,
  destination: LatLng
): Promise<number | null> {
  const key = optionalServerEnv("GOOGLE_MAPS_SERVER_KEY");
  if (!key) return null;

  const url = new URL(
    "https://maps.googleapis.com/maps/api/distancematrix/json"
  );
  url.searchParams.set("origins", `${origin.lat},${origin.lng}`);
  url.searchParams.set("destinations", `${destination.lat},${destination.lng}`);
  url.searchParams.set("mode", "driving");
  url.searchParams.set("key", key);

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      rows?: { elements?: { duration?: { value?: number }; status?: string }[] }[];
    };
    const element = data.rows?.[0]?.elements?.[0];
    if (!element || element.status !== "OK" || !element.duration?.value) {
      return null;
    }
    return Math.round(element.duration.value / 60);
  } catch {
    return null;
  }
}
