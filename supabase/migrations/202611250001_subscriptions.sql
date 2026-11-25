-- Additive subscription foundation. Payment processing is intentionally out of scope.
create table public.business_subscriptions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null unique references public.businesses(id) on delete cascade,
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

create index business_subscriptions_business_id_idx
  on public.business_subscriptions (business_id);

create trigger business_subscriptions_touch_updated_at
before update on public.business_subscriptions
for each row execute function public.touch_updated_at();

alter table public.business_subscriptions enable row level security;
revoke all on public.business_subscriptions from public, anon;
grant select on public.business_subscriptions to authenticated;

create policy "Members can read their business subscription"
  on public.business_subscriptions
  for select to authenticated
  using (public.is_business_member(business_id));

-- Prevent authenticated clients from directly updating subscription privileges.
-- Only trusted server-side billing/admin tooling (security definer functions) may modify rows.
create policy "Server-only WRITE on subscription privileges"
  on public.business_subscriptions
  for update to authenticated
  using (false);

-- Only trusted server-side billing/admin tooling may write subscription rows.
create or replace function public.seed_business_subscription()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.business_subscriptions (business_id, plan, status, free_plan_grandfathered)
  values (new.id, 'free', 'active', false)
  on conflict (business_id) do nothing;
  return new;
end;
$$;

revoke all on function public.seed_business_subscription() from public, anon, authenticated;

create trigger businesses_seed_subscription
after insert on public.businesses
for each row execute function public.seed_business_subscription();

insert into public.business_subscriptions (business_id, plan, status, free_plan_grandfathered)
select id, 'free', 'active', true
from public.businesses
on conflict (business_id) do nothing;

comment on table public.business_subscriptions is
  'Tenant-scoped subscription state. Payment provider integration is intentionally deferred.';
