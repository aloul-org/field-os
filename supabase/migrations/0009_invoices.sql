-- ============================================================================
-- 0009 Invoices and payments
-- ============================================================================

create table invoices (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade not null,
  customer_id uuid references customers(id) on delete set null,
  job_id uuid references jobs(id) on delete set null,
  estimate_id uuid references estimates(id) on delete set null,
  invoice_number text not null,
  line_items jsonb not null default '[]',
  subtotal decimal(10,2) not null,
  vat_rate decimal(4,3) not null default 0.200,
  vat_amount decimal(10,2) not null,
  total_inc_vat decimal(10,2) not null,
  status text not null default 'draft' check (status in (
    'draft','sent','paid','overdue','cancelled'
  )),
  due_date date not null,
  paid_at timestamptz,
  pdf_url text,
  stripe_payment_link text,
  stripe_payment_intent_id text,
  platform_fee_amount decimal(10,2),
  sent_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table invoices enable row level security;
create policy "invoices_own" on invoices for all using (company_id in (select get_user_company_ids()));
create trigger invoices_updated_at before update on invoices for each row execute function update_updated_at();

create index invoices_company_status_idx on invoices (company_id, status);
create unique index invoices_number_company_idx on invoices (company_id, invoice_number);
