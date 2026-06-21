-- ============================================================================
-- 0013 Denormalisation triggers + public (tokenised, no-login) RPCs
-- ============================================================================

-- ── Customer lifetime value (Module 1) ─────────────────────────────────────
-- Kept denormalised on customers.lifetime_value for fast list-page sorting,
-- recalculated whenever an invoice's paid status changes rather than on read.
create or replace function recalc_customer_lifetime_value()
returns trigger as $$
declare
  target_customer uuid;
begin
  target_customer := coalesce(new.customer_id, old.customer_id);
  if target_customer is null then
    return coalesce(new, old);
  end if;
  update customers set lifetime_value = (
    select coalesce(sum(total_inc_vat), 0) from invoices
    where customer_id = target_customer and status = 'paid'
  ) where id = target_customer;
  return coalesce(new, old);
end;
$$ language plpgsql security definer;

create trigger invoices_lifetime_value
  after insert or update or delete on invoices
  for each row execute function recalc_customer_lifetime_value();

-- ── Public invoice token ────────────────────────────────────────────────────
-- The spec routes /invoice/[token]; invoices need a non-guessable public token.
alter table invoices add column if not exists public_token uuid default gen_random_uuid();
create unique index if not exists invoices_public_token_idx on invoices (public_token);

-- ── Public quote acceptance page (/quote/[token]) ───────────────────────────
-- SECURITY DEFINER so the anonymous customer can read exactly one estimate by
-- its unguessable token, plus the contractor's branding — nothing else.
create or replace function get_public_estimate(p_token uuid)
returns jsonb as $$
  select jsonb_build_object(
    'estimate', to_jsonb(e) - 'company_id' - 'lead_id',
    'company', jsonb_build_object(
      'business_name', c.business_name,
      'logo_url', c.logo_url,
      'accent_colour', c.accent_colour,
      'phone', c.phone,
      'email', c.email,
      'region', c.region,
      'language', c.language
    )
  )
  from estimates e
  join companies c on c.id = e.company_id
  where e.acceptance_token = p_token;
$$ language sql security definer stable;

-- ── Public invoice + payment page (/invoice/[token]) ────────────────────────
create or replace function get_public_invoice(p_token uuid)
returns jsonb as $$
  select jsonb_build_object(
    'invoice', to_jsonb(i) - 'company_id',
    'company', jsonb_build_object(
      'business_name', c.business_name,
      'logo_url', c.logo_url,
      'accent_colour', c.accent_colour,
      'phone', c.phone,
      'email', c.email,
      'region', c.region,
      'language', c.language
    ),
    'customer_name', cu.name
  )
  from invoices i
  join companies c on c.id = i.company_id
  left join customers cu on cu.id = i.customer_id
  where i.public_token = p_token;
$$ language sql security definer stable;

grant execute on function get_public_estimate(uuid) to anon, authenticated;
grant execute on function get_public_invoice(uuid) to anon, authenticated;
