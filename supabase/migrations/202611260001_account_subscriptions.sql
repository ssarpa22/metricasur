-- Move subscriptions from individual businesses to the account that owns them.
-- Existing plans are consolidated per account using the highest existing tier.
-- Legacy business_subscriptions is retained as historical data and is no longer authoritative.

create table public.account_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'pro', 'business')),
  status text not null default 'active' check (status in ('active', 'trialing', 'past_due', 'cancelled')),
  started_at timestamptz not null default now(),
  renews_at timestamptz,
  billing_provider text,
  billing_provider_reference text,
  free_plan_grandfathered boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger account_subscriptions_touch_updated_at
before update on public.account_subscriptions
for each row execute function public.touch_updated_at();

alter table public.account_subscriptions enable row level security;
revoke all on public.account_subscriptions from public, anon, authenticated;
grant select on public.account_subscriptions to authenticated;

create policy "Users can read their own account subscription"
  on public.account_subscriptions
  for select to authenticated
  using (user_id = (select auth.uid()));

-- Consolidate legacy business plans into the business creator's account.
-- If the same account had different plans, preserve the highest tier.
insert into public.account_subscriptions (
  user_id, plan, status, started_at, renews_at,
  billing_provider, billing_provider_reference, free_plan_grandfathered
)
select distinct on (business.created_by)
  business.created_by,
  subscription.plan,
  subscription.status,
  subscription.started_at,
  subscription.renews_at,
  subscription.billing_provider,
  subscription.billing_provider_reference,
  subscription.free_plan_grandfathered
from public.businesses business
join public.business_subscriptions subscription
  on subscription.business_id = business.id
order by business.created_by,
  case subscription.plan when 'business' then 2 when 'pro' then 1 else 0 end desc,
  subscription.started_at asc
on conflict (user_id) do nothing;

-- Every existing account receives a Free subscription if it had no business yet.
insert into public.account_subscriptions (user_id, plan, status)
select id, 'free', 'active' from auth.users
on conflict (user_id) do nothing;

create or replace function public.seed_account_subscription()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.account_subscriptions (user_id, plan, status)
  values (new.id, 'free', 'active')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

revoke all on function public.seed_account_subscription() from public, anon, authenticated;

create trigger auth_users_seed_account_subscription
after insert on auth.users
for each row execute function public.seed_account_subscription();

-- The account plan, not a per-business plan, controls how many workspaces can be created.
-- The advisory lock makes the check atomic when multiple create requests race.
create or replace function public.create_business(p_name text, p_industry text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_business_id uuid;
  v_user_id uuid := (select auth.uid());
  v_name text := trim(coalesce(p_name, ''));
  v_plan text;
  v_limit integer;
  v_count integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if char_length(v_name) < 2 or char_length(v_name) > 120 then
    raise exception 'Business name must contain between 2 and 120 characters'
      using errcode = '22023';
  end if;

  if p_industry is null or p_industry not in (
    'retail', 'food_service', 'butcher', 'greengrocer', 'beauty',
    'healthcare', 'professional_services', 'freelancer', 'construction',
    'manufacturing', 'other'
  ) then
    raise exception 'Invalid business industry' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text, 0));

  insert into public.account_subscriptions (user_id, plan, status)
  values (v_user_id, 'free', 'active')
  on conflict (user_id) do nothing;

  select plan into v_plan
  from public.account_subscriptions
  where user_id = v_user_id;

  v_limit := case v_plan when 'free' then 1 when 'pro' then 1 when 'business' then 5 else 0 end;

  select count(*)::integer into v_count
  from public.businesses
  where created_by = v_user_id;

  if v_count >= v_limit then
    raise exception 'Account business limit reached' using errcode = '42501';
  end if;

  insert into public.businesses (name, industry, created_by)
  values (v_name, p_industry, v_user_id)
  returning id into v_business_id;

  insert into public.business_memberships (business_id, user_id, role)
  values (v_business_id, v_user_id, 'owner');

  return v_business_id;
end;
$$;

revoke all on function public.create_business(text, text) from public, anon;
grant execute on function public.create_business(text, text) to authenticated;

-- The legacy trigger would create an irrelevant per-business subscription on every new workspace.
drop trigger if exists businesses_seed_subscription on public.businesses;

-- Enforce monthly record usage across every business owned by the account.
-- The account lock serializes inserts across different workspaces of the same user.
create or replace function public.enforce_monthly_business_record_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_plan text;
  v_limit integer;
  v_count integer;
  v_start timestamptz := date_trunc('month', now() at time zone 'UTC') at time zone 'UTC';
  v_end timestamptz := (date_trunc('month', now() at time zone 'UTC') + interval '1 month') at time zone 'UTC';
begin
  new.created_at := now();

  select created_by into v_user_id
  from public.businesses
  where id = new.business_id;

  if v_user_id is null then
    raise exception 'Business owner is required' using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text, 0));

  select plan into v_plan
  from public.account_subscriptions
  where user_id = v_user_id;

  if v_plan is null then
    raise exception 'Account subscription is required before creating records' using errcode = '42501';
  end if;

  v_limit := case v_plan when 'free' then 100 when 'pro' then 1000 when 'business' then 5000 else 0 end;

  select count(*)::integer into v_count
  from public.business_records record
  join public.businesses business on business.id = record.business_id
  where business.created_by = v_user_id
    and record.created_at >= v_start
    and record.created_at < v_end;

  if v_count >= v_limit then
    raise exception 'Monthly account record limit reached' using errcode = '42501';
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_monthly_business_record_limit() from public, anon, authenticated;

comment on table public.account_subscriptions is
  'One subscription per authenticated account. Business and monthly record limits are aggregated across businesses created by that account.';
comment on table public.business_subscriptions is
  'Deprecated historical table. Account-level subscription state is stored in account_subscriptions.';
comment on function public.enforce_monthly_business_record_limit() is
  'Atomically enforces the monthly operational record limit across all businesses owned by one account.';
