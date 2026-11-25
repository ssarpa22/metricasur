-- Prevent tenant ownership and module identity from being changed through direct updates.
-- Server Actions already restrict these fields; this trigger is the database defense in depth.
create or replace function public.prevent_business_record_identity_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.business_id is distinct from old.business_id
     or new.module_slug is distinct from old.module_slug
     or new.created_by is distinct from old.created_by
     or new.created_at is distinct from old.created_at then
    raise exception 'Business record ownership cannot be changed'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

revoke all on function public.prevent_business_record_identity_change() from public, anon, authenticated;

create trigger business_records_identity_guard
before update on public.business_records
for each row execute function public.prevent_business_record_identity_change();

comment on function public.prevent_business_record_identity_change() is
  'Prevents moving an operational record across tenants, modules, or creators.';

-- Keep the monthly limit atomic for concurrent inserts. The values mirror the
-- centralized application catalog and are enforced here as defense in depth
-- for direct authenticated database requests.
create or replace function public.enforce_monthly_business_record_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_limit integer;
  v_count integer;
  v_start timestamptz := date_trunc('month', now() at time zone 'UTC') at time zone 'UTC';
  v_end timestamptz := (date_trunc('month', now() at time zone 'UTC') + interval '1 month') at time zone 'UTC';
begin
  -- The database timestamp is authoritative; clients cannot backdate or future-date usage.
  new.created_at := now();
  perform pg_advisory_xact_lock(hashtextextended(new.business_id::text, 0));

  select case subscription.plan
    when 'free' then 100
    when 'pro' then 1000
    when 'business' then 5000
    else 0
  end
  into v_limit
  from public.business_subscriptions subscription
  where subscription.business_id = new.business_id;

  if v_limit is null then
    raise exception 'Subscription is required before creating records' using errcode = '42501';
  end if;

  select count(*)::integer into v_count
  from public.business_records record
  where record.business_id = new.business_id
    and record.created_at >= v_start
    and record.created_at < v_end;

  if v_count >= v_limit then
    raise exception 'Monthly business record limit reached' using errcode = '42501';
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_monthly_business_record_limit() from public, anon, authenticated;

create trigger business_records_monthly_limit_guard
before insert on public.business_records
for each row execute function public.enforce_monthly_business_record_limit();

comment on function public.enforce_monthly_business_record_limit() is
  'Atomically enforces the configured monthly operational record limit per business.';
