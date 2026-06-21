-- ============================================================================
-- 0010 Finance intelligence
-- ============================================================================

-- Per-job cost snapshot, recalculated whenever a job's invoice is paid.
create table job_profitability (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade not null,
  job_id uuid references jobs(id) on delete cascade not null,
  technician_id uuid references team_members(id) on delete set null,
  revenue decimal(10,2) not null,
  labour_cost decimal(10,2) default 0,
  material_cost decimal(10,2) default 0,
  overhead_allocated decimal(10,2) default 0,
  profit decimal(10,2),
  margin_pct decimal(5,2),
  created_at timestamptz default now()
);

create table ai_coach_conversations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text,
  created_at timestamptz default now()
);

create table ai_coach_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references ai_coach_conversations(id) on delete cascade not null,
  role text not null check (role in ('user','assistant')),
  content text not null,
  data_used jsonb,
  created_at timestamptz default now()
);

alter table job_profitability enable row level security;
alter table ai_coach_conversations enable row level security;
alter table ai_coach_messages enable row level security;
create policy "job_profitability_own" on job_profitability for all using (company_id in (select get_user_company_ids()));
create policy "ai_coach_conversations_own" on ai_coach_conversations for all using (
  company_id in (select get_user_company_ids()) and user_id = auth.uid()
);
create policy "ai_coach_messages_own" on ai_coach_messages for all using (
  conversation_id in (select id from ai_coach_conversations where user_id = auth.uid())
);

create unique index job_profitability_job_idx on job_profitability (job_id);
