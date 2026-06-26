import Link from "next/link";
import { Star, AlertTriangle } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { createClient } from "@/lib/supabase/server";
import { requireSection } from "@/lib/auth/session";
import { canWrite } from "@/lib/auth/roles";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { RequestReviewButton, LogBadReviewDialog } from "@/components/reviews/ReviewActions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Reviews" };

function StarRow({ rating }: { rating: number | null }) {
  if (rating === null) return null;
  return (
    <span className="inline-flex shrink-0">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={
            i < rating
              ? "h-3.5 w-3.5 fill-warning text-warning"
              : "h-3.5 w-3.5 text-muted-foreground/30"
          }
        />
      ))}
    </span>
  );
}

export default async function ReviewsPage() {
  const ctx = await requireSection("reviews");
  const supabase = createClient();
  const region = ctx.company.region;
  const writable = canWrite(ctx.role);
  const t = await getTranslations("reviews");

  const [{ data: recentJobs }, { data: requests }, { data: customers }, { data: googleReviews }] =
    await Promise.all([
      // Completed/invoiced jobs not yet asked for a review.
      supabase
        .from("jobs")
        .select("id, title, customers(name)")
        .eq("company_id", ctx.company.id)
        .in("status", ["completed", "invoiced"])
        .order("updated_at", { ascending: false })
        .limit(20),
      supabase
        .from("review_requests")
        .select("id, channel, status, sent_at, customers(name)")
        .eq("company_id", ctx.company.id)
        .order("sent_at", { ascending: false })
        .limit(50),
      supabase
        .from("customers")
        .select("id, name")
        .eq("company_id", ctx.company.id)
        .order("name"),
      supabase
        .from("google_reviews")
        .select("id, author_name, rating, review_text, relative_time, reviewed_at")
        .eq("company_id", ctx.company.id)
        .order("reviewed_at", { ascending: false })
        .limit(10),
    ]);

  const hasLink = Boolean(ctx.company.google_business_profile_url);
  const hasPlaceId = Boolean(ctx.company.google_place_id);

  return (
    <div>
      <PageHeader
        title={t("title")}
        description={t("description")}
        action={writable ? <LogBadReviewDialog customers={customers ?? []} /> : null}
      />

      {!hasLink && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-warning/30 bg-warning/5 p-3 text-sm">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <span>
            Add your Google review link in{" "}
            <Link href="/settings" className="underline">
              Settings
            </Link>{" "}
            to start requesting reviews.
          </span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("askForReview")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {!recentJobs || recentJobs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Completed jobs will appear here so you can ask for a review.
              </p>
            ) : (
              recentJobs.map((j) => {
                const customer = j.customers as unknown as { name: string } | null;
                return (
                  <div
                    key={j.id}
                    className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{j.title}</p>
                      {customer && (
                        <p className="truncate text-muted-foreground">{customer.name}</p>
                      )}
                    </div>
                    {writable && hasLink && <RequestReviewButton jobId={j.id} />}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("history")}</CardTitle>
          </CardHeader>
          <CardContent>
            {!requests || requests.length === 0 ? (
              <EmptyState
                icon={Star}
                title="No requests yet"
                description="Review requests you send will be tracked here."
              />
            ) : (
              <ul className="space-y-2">
                {requests.map((r) => {
                  const customer = r.customers as unknown as { name: string } | null;
                  const recovery = r.status === "recovery";
                  return (
                    <li
                      key={r.id}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="min-w-0 truncate">
                        {customer?.name ?? "Customer"}
                        <span className="text-muted-foreground"> · {r.channel}</span>
                      </span>
                      <Badge variant={recovery ? "destructive" : "secondary"}>
                        {recovery ? "Recovery" : r.status}
                        {" · "}
                        {formatDate(r.sent_at, region)}
                      </Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Recent Google reviews</CardTitle>
          </CardHeader>
          <CardContent>
            {!hasPlaceId ? (
              <p className="text-sm text-muted-foreground">
                Add your{" "}
                <Link href="/settings" className="underline">
                  Google Place ID in Settings
                </Link>{" "}
                to automatically watch for new reviews here.
              </p>
            ) : !googleReviews || googleReviews.length === 0 ? (
              <EmptyState
                icon={Star}
                title="No reviews picked up yet"
                description="New Google reviews appear here once the daily check finds them."
              />
            ) : (
              <ul className="space-y-3">
                {googleReviews.map((r) => (
                  <li key={r.id} className="rounded-md border p-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 font-medium">
                        {r.author_name ?? "Anonymous"}
                        <StarRow rating={r.rating} />
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {r.relative_time ?? (r.reviewed_at ? formatDate(r.reviewed_at, region) : "")}
                      </span>
                    </div>
                    {r.review_text && (
                      <p className="mt-1 text-muted-foreground">{r.review_text}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
