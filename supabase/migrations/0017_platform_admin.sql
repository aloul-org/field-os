-- ============================================================================
-- 0017 Platform admin
-- Adds a platform-operator role (distinct from any per-company TeamRole) that
-- can see and manage every tenant, plus a company-level suspend/reactivate
-- flag. Cross-tenant reads/writes for this feature go through the service-role
-- client in app code (see lib/admin/manage-companies.ts) rather than RLS, so
-- no policy here grants cross-company access on any existing table.
-- ============================================================================

create table platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

alter table platform_admins enable row level security;

-- A user may only ever check their own membership — granting/revoking admin
-- access happens out-of-band (service role), never through the app.
create policy "platform_admins_self_read" on platform_admins
  for select using (user_id = auth.uid());

-- Mirrors get_user_role()'s shape (0001_helpers.sql) for any future RLS policy
-- that needs a platform-admin carve-out.
create or replace function is_platform_admin()
returns boolean as $$
  select exists (
    select 1 from platform_admins where user_id = auth.uid()
  )
$$ language sql security definer stable;

alter table companies
  add column platform_status text not null default 'active'
    check (platform_status in ('active', 'suspended')),
  add column suspended_at timestamptz,
  add column suspended_reason text;
