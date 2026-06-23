-- ============================================================================
-- 0015 Realtime publication for the live dispatch board (spec Module 3)
-- Adds the tables the board subscribes to so Supabase emits postgres_changes.
-- Realtime still honours RLS for the authenticated client, so a company only
-- ever receives its own rows. `add table` errors if already present, so guard it.
-- ============================================================================

do $$
begin
  begin
    alter publication supabase_realtime add table appointments;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table team_members;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table jobs;
  exception when duplicate_object then null;
  end;
end $$;
