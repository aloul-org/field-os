-- ============================================================================
-- 0011 Sales automation, renewals, reviews, nudges
-- ============================================================================

create table follow_up_log (
  id uuid primary key default gen_random_uuid(),
  estimate_id uuid references estimates(id) on delete cascade not null,
  channel text not null check (channel in ('whatsapp','sms','email')),
  message_body text not null,
  sent_at timestamptz default now()
);

create table renewal_plans (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade not null,
  customer_id uuid references customers(id) on delete cascade not null,
  property_id uuid references properties(id) on delete set null,
  plan_type text not null,
  interval_months integer not null default 12,
  next_due_date date not null,
  last_completed_date date,
  status text default 'active' check (status in ('active','paused','cancelled')),
  created_at timestamptz default now()
);

create table review_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade not null,
  customer_id uuid references customers(id) on delete set null,
  job_id uuid references jobs(id) on delete set null,
  channel text not null check (channel in ('whatsapp','sms','email')),
  sent_at timestamptz default now(),
  status text default 'sent'
);

create table pricing_nudges (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade not null,
  nudge_type text not null,
  message text not null,
  action_label text,
  action_url text,
  dismissed_at timestamptz,
  created_at timestamptz default now()
);

alter table follow_up_log enable row level security;
alter table renewal_plans enable row level security;
alter table review_requests enable row level security;
alter table pricing_nudges enable row level security;
create policy "follow_up_log_own" on follow_up_log for all using (
  estimate_id in (select id from estimates where company_id in (select get_user_company_ids()))
);
create policy "renewal_plans_own" on renewal_plans for all using (company_id in (select get_user_company_ids()));
create policy "review_requests_own" on review_requests for all using (company_id in (select get_user_company_ids()));
create policy "pricing_nudges_own" on pricing_nudges for all using (company_id in (select get_user_company_ids()));
