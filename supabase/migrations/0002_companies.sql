-- ============================================================================
-- 0002 Companies
-- The root tenant table. Almost every other table hangs off company_id.
-- NOTE: company_size, monthly_overhead and voice_greeting are not in the
-- prompt's literal SQL but are required by the narrative spec (sidebar gating
-- for solo accounts, Module 9 overhead allocation, Module 2 Pro custom greeting).
-- ============================================================================

create table companies (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  owner_user_id uuid references auth.users(id) on delete cascade not null,
  trade text not null check (trade in (
    'plumbing','electrical','hvac','roofing','landscaping',
    'cleaning','pest_control','appliance_repair','pool_services',
    'general_contracting','other'
  )),
  email text not null,
  phone text,
  address text,
  region text not null default 'UK' check (region in ('UK','DE')),
  timezone text not null default 'Europe/London',
  logo_url text,
  accent_colour text default '#0F766E',
  default_hourly_rate decimal(10,2),
  default_call_out_fee decimal(10,2),
  vat_registered boolean not null default true,
  vat_number text,
  vat_rate decimal(4,3) not null default 0.200,
  payment_terms_days integer default 14,
  language text not null default 'en' check (language in ('en','de')),
  business_hours jsonb default '{"mon":["08:00","18:00"],"tue":["08:00","18:00"],"wed":["08:00","18:00"],"thu":["08:00","18:00"],"fri":["08:00","18:00"],"sat":null,"sun":null}',
  company_size text default 'solo' check (company_size in ('solo','2-5','6-20','21-100')),
  monthly_overhead decimal(10,2) default 0,
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_connect_account_id text,
  subscription_plan text default 'starter' check (subscription_plan in ('starter','growth','pro','enterprise')),
  subscription_status text default 'trialing' check (subscription_status in (
    'trialing','active','past_due','canceled','incomplete'
  )),
  trial_ends_at timestamptz default (now() + interval '14 days'),
  google_business_profile_url text,
  twilio_voice_number text,
  voice_receptionist_enabled boolean default false,
  voice_greeting text,
  widget_public_key uuid default gen_random_uuid(),
  widget_enabled boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table companies enable row level security;
create policy "companies_member_read" on companies
  for select using (id in (select get_user_company_ids()) or owner_user_id = auth.uid());
create policy "companies_owner_write" on companies
  for update using (owner_user_id = auth.uid());
create policy "companies_owner_insert" on companies
  for insert with check (owner_user_id = auth.uid());
create trigger companies_updated_at before update on companies
  for each row execute function update_updated_at();
