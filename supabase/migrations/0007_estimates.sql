-- ============================================================================
-- 0007 Estimates (quotes) and win probability
-- ============================================================================

create table estimates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade not null,
  customer_id uuid references customers(id) on delete set null,
  property_id uuid references properties(id) on delete set null,
  lead_id uuid references leads(id) on delete set null,
  job_id uuid references jobs(id) on delete set null,
  estimate_number text not null,
  job_title text not null,
  trade_category text not null,
  job_description_raw text,
  summary_for_customer text not null,
  line_items jsonb not null default '[]',
  subtotal decimal(10,2) not null,
  vat_rate decimal(4,3) not null default 0.200,
  vat_amount decimal(10,2) not null,
  total_inc_vat decimal(10,2) not null,
  estimated_duration_hours decimal(4,1),
  ai_confidence text check (ai_confidence in ('high','medium','low')),
  ai_flags jsonb default '[]',
  win_probability integer,
  win_probability_factors jsonb default '[]',
  photo_urls jsonb default '[]',
  status text not null default 'draft' check (status in (
    'draft','sent','accepted','rejected','expired'
  )),
  pdf_url text,
  acceptance_token uuid default gen_random_uuid(),
  sent_at timestamptz,
  accepted_at timestamptz,
  rejected_at timestamptz,
  expires_at timestamptz default (now() + interval '30 days'),
  follow_up_1_sent_at timestamptz,
  follow_up_2_sent_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table estimates enable row level security;
create policy "estimates_own" on estimates for all using (company_id in (select get_user_company_ids()));
create trigger estimates_updated_at before update on estimates for each row execute function update_updated_at();

-- Public acceptance page looks up an estimate by its acceptance_token via a
-- SECURITY DEFINER RPC (see 0013), so no anon SELECT policy is exposed here.
create index estimates_company_status_idx on estimates (company_id, status);
create unique index estimates_acceptance_token_idx on estimates (acceptance_token);

-- jobs.estimate_id and estimates.job_id reference each other; add the FK now
-- that estimates exists.
alter table jobs
  add constraint jobs_estimate_id_fkey
  foreign key (estimate_id) references estimates(id) on delete set null;
