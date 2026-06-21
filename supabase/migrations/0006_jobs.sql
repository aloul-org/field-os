-- ============================================================================
-- 0006 Jobs, appointments, job content
-- A job is the central work record. Appointments are scheduled visits.
-- ============================================================================

create table jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade not null,
  customer_id uuid references customers(id) on delete set null,
  property_id uuid references properties(id) on delete set null,
  lead_id uuid references leads(id) on delete set null,
  estimate_id uuid,
  job_number text not null,
  title text not null,
  trade_category text not null,
  description text,
  status text not null default 'unscheduled' check (status in (
    'unscheduled','scheduled','en_route','in_progress','completed','invoiced','cancelled'
  )),
  priority text default 'normal' check (priority in ('emergency','urgent','normal','flexible')),
  estimated_duration_minutes integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table appointments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade not null,
  job_id uuid references jobs(id) on delete cascade not null,
  assigned_technician_id uuid references team_members(id) on delete set null,
  scheduled_start timestamptz not null,
  scheduled_end timestamptz not null,
  actual_start timestamptz,
  actual_end timestamptz,
  status text default 'scheduled' check (status in (
    'scheduled','en_route','on_site','completed','cancelled','rescheduled'
  )),
  route_order integer,
  travel_time_minutes_from_previous integer,
  created_at timestamptz default now()
);

create table job_photos (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references jobs(id) on delete cascade not null,
  uploaded_by uuid references team_members(id) on delete set null,
  photo_url text not null,
  caption text,
  photo_type text default 'progress' check (photo_type in ('before','progress','after','issue')),
  created_at timestamptz default now()
);

create table job_checklist_items (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references jobs(id) on delete cascade not null,
  description text not null,
  is_complete boolean default false,
  sort_order integer default 0
);

-- Office-editable checklist templates copied onto each new job at creation,
-- keyed by trade_category (Module 4).
create table job_checklist_templates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade not null,
  trade_category text not null,
  description text not null,
  sort_order integer default 0,
  created_at timestamptz default now()
);

create table job_reports (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references jobs(id) on delete cascade not null,
  technician_id uuid references team_members(id) on delete set null,
  voice_transcript text,
  ai_formatted_report text,
  materials_used jsonb default '[]',
  signature_url text,
  signed_by_name text,
  created_at timestamptz default now()
);

alter table jobs enable row level security;
alter table appointments enable row level security;
alter table job_photos enable row level security;
alter table job_checklist_items enable row level security;
alter table job_checklist_templates enable row level security;
alter table job_reports enable row level security;

create policy "jobs_own" on jobs for all using (company_id in (select get_user_company_ids()));
create policy "appointments_own" on appointments for all using (company_id in (select get_user_company_ids()));
create policy "job_checklist_templates_own" on job_checklist_templates for all using (company_id in (select get_user_company_ids()));
create policy "job_photos_own" on job_photos for all using (
  job_id in (select id from jobs where company_id in (select get_user_company_ids()))
);
create policy "job_checklist_own" on job_checklist_items for all using (
  job_id in (select id from jobs where company_id in (select get_user_company_ids()))
);
create policy "job_reports_own" on job_reports for all using (
  job_id in (select id from jobs where company_id in (select get_user_company_ids()))
);
create trigger jobs_updated_at before update on jobs for each row execute function update_updated_at();

create index jobs_company_status_idx on jobs (company_id, status);
create index appointments_company_start_idx on appointments (company_id, scheduled_start);
create index appointments_technician_idx on appointments (assigned_technician_id, scheduled_start);
