-- ============================================================================
-- 0012 Notifications and the background job queue
-- ============================================================================

create table notifications (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  link text,
  is_read boolean default false,
  created_at timestamptz default now()
);

create table jobs_queue (
  id uuid primary key default gen_random_uuid(),
  task_type text not null,
  payload jsonb not null,
  status text default 'pending' check (status in ('pending','processing','completed','failed')),
  attempts integer default 0,
  error text,
  created_at timestamptz default now(),
  processed_at timestamptz
);

alter table notifications enable row level security;
create policy "notifications_own" on notifications for all using (
  company_id in (select get_user_company_ids()) and (user_id = auth.uid() or user_id is null)
);

-- jobs_queue has NO RLS by design — only ever touched by the service role from
-- cron / background routes. Leaving RLS disabled is intentional here.
create index notifications_user_unread_idx on notifications (user_id, is_read);
create index jobs_queue_status_idx on jobs_queue (status, created_at);
