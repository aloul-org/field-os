import { optionalServerEnv } from "@/lib/env";

export interface GoogleReview {
  googleReviewId: string;
  authorName: string | null;
  rating: number | null;
  text: string | null;
  relativeTime: string | null;
  reviewedAt: string | null;
}

/**
 * Up to 5 most recent reviews for a Place, via the Places API (New) `reviews`
 * field — readable with a plain Maps Platform API key (GOOGLE_MAPS_SERVER_KEY,
 * shared with distanceMatrix.ts). Deliberately not the Business Profile API:
 * that needs OAuth + verified ownership and full history, which is out of
 * scope for v1's "watch for new reviews" use case. Returns null when no key
 * or place ID is configured, so polling degrades to a no-op rather than error.
 */
export async function fetchGoogleReviews(placeId: string): Promise<GoogleReview[] | null> {
  const key = optionalServerEnv("GOOGLE_MAPS_SERVER_KEY");
  if (!key || !placeId) return null;

  try {
    const res = await fetch(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
      {
        headers: {
          "X-Goog-Api-Key": key,
          "X-Goog-FieldMask": "reviews",
        },
        cache: "no-store",
      }
    );
    if (!res.ok) return null;

    const data = (await res.json()) as {
      reviews?: {
        name?: string;
        authorAttribution?: { displayName?: string };
        rating?: number;
        text?: { text?: string };
        relativePublishTimeDescription?: string;
        publishTime?: string;
      }[];
    };

    return (data.reviews ?? []).map((r) => ({
      googleReviewId: r.name ?? `${r.publishTime ?? ""}-${r.authorAttribution?.displayName ?? ""}`,
      authorName: r.authorAttribution?.displayName ?? null,
      rating: typeof r.rating === "number" ? r.rating : null,
      text: r.text?.text ?? null,
      relativeTime: r.relativePublishTimeDescription ?? null,
      reviewedAt: r.publishTime ?? null,
    }));
  } catch {
    return null;
  }
}
