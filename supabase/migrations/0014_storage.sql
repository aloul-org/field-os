-- ============================================================================
-- 0014 Storage buckets + access policies
-- Path convention for every bucket: "{company_id}/..." so policies can scope
-- access by the user's company membership via the first folder segment.
-- ============================================================================

insert into storage.buckets (id, name, public)
values
  ('logos', 'logos', true),
  ('pdfs', 'pdfs', true),
  ('job-photos', 'job-photos', false),
  ('voice-recordings', 'voice-recordings', false),
  ('signatures', 'signatures', false)
on conflict (id) do nothing;

-- Public buckets (logos, pdfs): world-readable, company members write.
create policy "public_buckets_read" on storage.objects
  for select using (bucket_id in ('logos', 'pdfs'));

create policy "company_buckets_write" on storage.objects
  for insert to authenticated with check (
    bucket_id in ('logos', 'pdfs', 'job-photos', 'voice-recordings', 'signatures')
    and (storage.foldername(name))[1]::uuid in (select get_user_company_ids())
  );

create policy "company_buckets_update" on storage.objects
  for update to authenticated using (
    (storage.foldername(name))[1]::uuid in (select get_user_company_ids())
  );

create policy "company_buckets_delete" on storage.objects
  for delete to authenticated using (
    (storage.foldername(name))[1]::uuid in (select get_user_company_ids())
  );

-- Private buckets: only company members may read (server issues signed URLs for
-- customer-facing surfaces).
create policy "company_private_read" on storage.objects
  for select to authenticated using (
    bucket_id in ('job-photos', 'voice-recordings', 'signatures')
    and (storage.foldername(name))[1]::uuid in (select get_user_company_ids())
  );
