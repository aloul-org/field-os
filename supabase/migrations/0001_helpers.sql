-- ============================================================================
-- 0001 Helper functions
-- Create these FIRST — every table's RLS policy depends on them.
-- ============================================================================

-- Returns every company the current user belongs to (owner or accepted member).
create or replace function get_user_company_ids()
returns setof uuid as $$
  select company_id from team_members
  where user_id = auth.uid() and invite_accepted_at is not null
$$ language sql security definer stable;

-- Returns the current user's role within a specific company.
create or replace function get_user_role(p_company_id uuid)
returns text as $$
  select role from team_members
  where user_id = auth.uid() and company_id = p_company_id and invite_accepted_at is not null
  limit 1
$$ language sql security definer stable;

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;
