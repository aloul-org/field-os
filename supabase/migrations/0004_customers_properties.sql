-- ============================================================================
-- 0004 Customers and properties (CRM core)
-- ============================================================================

create table customers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade not null,
  name text not null,
  email text,
  phone text,
  notes text,
  customer_type text default 'residential' check (customer_type in ('residential','commercial')),
  lifetime_value decimal(10,2) default 0,
  ai_summary text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table properties (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade not null,
  customer_id uuid references customers(id) on delete cascade not null,
  label text default 'Main property',
  address_line1 text not null,
  address_line2 text,
  city text,
  postcode text,
  country text default 'UK',
  lat decimal(10,7),
  lng decimal(10,7),
  access_notes text,
  property_value_estimate decimal(12,2),
  created_at timestamptz default now()
);

alter table customers enable row level security;
alter table properties enable row level security;
create policy "customers_own" on customers
  for all using (company_id in (select get_user_company_ids()));
create policy "properties_own" on properties
  for all using (company_id in (select get_user_company_ids()));
create trigger customers_updated_at before update on customers
  for each row execute function update_updated_at();

create index customers_company_idx on customers (company_id);
create index properties_customer_idx on properties (customer_id);
