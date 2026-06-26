import { createAdminClient } from "@/lib/supabase/server";
import { optionalServerEnv } from "@/lib/env";
import { ok, err } from "@/lib/api/response";
import { fetchGoogleReviews } from "@/lib/reviews/googlePlaces";

export const runtime = "nodejs";

/**
 * Daily Google review poll. For each company with a google_place_id set,
 * fetches their latest reviews via the Places API and stores any not seen
 * before (deduped on google_review_id). New reviews rated 3★ or below raise
 * a notification so the office can reach out — mirrors the manual recovery
 * flow in app/(app)/reviews/actions.ts. No-ops entirely for companies without
 * GOOGLE_MAPS_SERVER_KEY configured or a place ID set. Gate with CRON_SECRET.
 */
export async function POST(request: Request) {
  const secret = optionalServerEnv("CRON_SECRET");
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) return err("Unauthorized", 401);
  }

  const admin = createAdminClient();

  const { data: companies } = await admin
    .from("companies")
    .select("id, business_name, google_place_id")
    .not("google_place_id", "is", null);

  let polled = 0;
  let newReviews = 0;
  let flagged = 0;

  for (const company of companies ?? []) {
    if (!company.google_place_id) continue;
    const reviews = await fetchGoogleReviews(company.google_place_id);
    if (!reviews) continue;
    polled += 1;

    for (const review of reviews) {
      const { data: inserted } = await admin
        .from("google_reviews")
        .upsert(
          {
            company_id: company.id,
            google_review_id: review.googleReviewId,
            author_name: review.authorName,
            rating: review.rating,
            review_text: review.text,
            relative_time: review.relativeTime,
            reviewed_at: review.reviewedAt,
          },
          { onConflict: "company_id,google_review_id", ignoreDuplicates: true }
        )
        .select("id")
        .maybeSingle();

      if (!inserted) continue;
      newReviews += 1;

      if (review.rating !== null && review.rating <= 3) {
        flagged += 1;
        await admin.from("notifications").insert({
          company_id: company.id,
          user_id: null,
          type: "google_review_low_rating",
          title: "New low-rated Google review",
          body: `${review.authorName ?? "A customer"} left a ${review.rating}★ review${
            review.text ? `: "${review.text.slice(0, 140)}"` : "."
          }`,
          link: "/reviews",
        });
      }
    }
  }

  return ok({ companiesPolled: polled, newReviews, flagged });
}
