-- ============================================================================
-- 0008 Materials, inventory and suppliers
-- ============================================================================

create table materials (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade not null,
  name text not null,
  sku text,
  category text,
  unit text default 'item',
  unit_cost decimal(10,2),
  quantity_on_hand decimal(10,2) default 0,
  reorder_threshold decimal(10,2) default 0,
  preferred_supplier_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table suppliers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade not null,
  name text not null,
  contact_email text,
  contact_phone text,
  notes text,
  created_at timestamptz default now()
);

create table material_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade not null,
  supplier_id uuid references suppliers(id) on delete set null,
  material_id uuid references materials(id) on delete set null,
  job_id uuid references jobs(id) on delete set null,
  quantity_requested decimal(10,2) not null,
  status text default 'draft' check (status in ('draft','sent','confirmed','received','cancelled')),
  notes text,
  created_at timestamptz default now()
);

alter table materials add constraint materials_preferred_supplier_fkey
  foreign key (preferred_supplier_id) references suppliers(id) on delete set null;

alter table materials enable row level security;
alter table suppliers enable row level security;
alter table material_requests enable row level security;
create policy "materials_own" on materials for all using (company_id in (select get_user_company_ids()));
create policy "suppliers_own" on suppliers for all using (company_id in (select get_user_company_ids()));
create policy "material_requests_own" on material_requests for all using (company_id in (select get_user_company_ids()));
create trigger materials_updated_at before update on materials for each row execute function update_updated_at();
