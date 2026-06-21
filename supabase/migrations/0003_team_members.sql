-- ============================================================================
-- 0003 Team members
-- Links auth.users to a company with a role. Multi-user from day one.
-- ============================================================================

create table team_members (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  role text not null check (role in ('owner','admin','dispatcher','estimator','technician','viewer')),
  hourly_rate decimal(10,2),
  skills text[] default '{}',
  phone text,
  avatar_url text,
  is_active boolean default true,
  invite_token uuid default gen_random_uuid(),
  invite_accepted_at timestamptz,
  last_known_lat decimal(10,7),
  last_known_lng decimal(10,7),
  last_location_at timestamptz,
  created_at timestamptz default now()
);

alter table team_members enable row level security;

create policy "team_members_read" on team_members
  for select using (company_id in (select get_user_company_ids()));

create policy "team_members_write" on team_members
  for all using (get_user_role(company_id) in ('owner','admin'));

-- Bootstrap: an owner must be able to insert their own owner row immediately
-- after creating a company, before any team_members row (and thus role) exists.
create policy "team_members_owner_bootstrap" on team_members
  for insert with check (
    user_id = auth.uid()
    and company_id in (select id from companies where owner_user_id = auth.uid())
  );

-- A user may accept their own invite (link an unclaimed row to their auth.uid).
create policy "team_members_self_update" on team_members
  for update using (user_id = auth.uid());
