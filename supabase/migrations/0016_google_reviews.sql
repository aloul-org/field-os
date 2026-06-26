-- ============================================================================
-- 0016 Google review polling
-- ============================================================================
-- Uses the Google Places API (New) "reviews" field on a Place — accessible
-- with a plain Maps Platform API key (GOOGLE_MAPS_SERVER_KEY, already in use
-- for distance matrix). This is deliberately the lightweight read-only path:
-- it surfaces the up-to-5 most recent reviews Google exposes per place, not
-- the full Business Profile API (which requires OAuth + verified ownership
-- and is out of scope for v1).

alter table companies add column google_place_id text;

create table google_reviews (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade not null,
  google_review_id text not null,
  author_name text,
  rating integer,
  review_text text,
  relative_time text,
  reviewed_at timestamptz,
  created_at timestamptz default now(),
  unique (company_id, google_review_id)
);

alter table google_reviews enable row level security;
create policy "google_reviews_own" on google_reviews for all using (company_id in (select get_user_company_ids()));
create index google_reviews_company_idx on google_reviews (company_id, reviewed_at desc);
