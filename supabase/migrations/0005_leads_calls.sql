-- ============================================================================
-- 0005 Leads and calls (AI lead capture)
-- ============================================================================

create table leads (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade not null,
  customer_id uuid references customers(id) on delete set null,
  source text not null check (source in (
    'phone_call','whatsapp','sms','website_widget','facebook','instagram','manual','email'
  )),
  contact_name text,
  contact_phone text,
  contact_email text,
  raw_message text,
  job_description text,
  address text,
  score text check (score in ('hot','warm','cold')),
  score_reason text,
  status text not null default 'new' check (status in (
    'new','contacted','quoted','converted','lost','spam'
  )),
  assigned_to uuid references team_members(id) on delete set null,
  converted_to_job_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table calls (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade not null,
  lead_id uuid references leads(id) on delete set null,
  twilio_call_sid text not null unique,
  caller_number text not null,
  direction text not null default 'inbound' check (direction in ('inbound','outbound')),
  status text not null default 'in_progress' check (status in (
    'in_progress','completed','voicemail','missed','forwarded_to_human','failed'
  )),
  duration_seconds integer,
  recording_url text,
  transcript text,
  ai_summary text,
  urgency text check (urgency in ('emergency','urgent','normal','flexible')),
  started_at timestamptz default now(),
  ended_at timestamptz,
  created_at timestamptz default now()
);

alter table leads enable row level security;
alter table calls enable row level security;
create policy "leads_own" on leads
  for all using (company_id in (select get_user_company_ids()));
create policy "calls_own" on calls
  for all using (company_id in (select get_user_company_ids()));
create trigger leads_updated_at before update on leads
  for each row execute function update_updated_at();

create index leads_company_status_idx on leads (company_id, status);
create index calls_company_idx on calls (company_id);
