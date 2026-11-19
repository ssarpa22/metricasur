-- MétricaSur: initial multi-tenant foundation.
-- Apply with Supabase CLI: supabase db push

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 120),
  created_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.business_memberships (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now(),
  unique (business_id, user_id)
);

create index business_memberships_user_id_idx
  on public.business_memberships (user_id);

create index business_memberships_business_id_idx
  on public.business_memberships (business_id);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger businesses_touch_updated_at
before update on public.businesses
for each row execute function public.touch_updated_at();

-- SECURITY DEFINER avoids recursive membership RLS checks. The fixed empty
-- search_path and fully-qualified object names prevent search_path hijacking.
create or replace function public.is_business_member(p_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.business_memberships membership
    where membership.business_id = p_business_id
      and membership.user_id = (select auth.uid())
  );
$$;

create or replace function public.is_business_admin(p_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.business_memberships membership
    where membership.business_id = p_business_id
      and membership.user_id = (select auth.uid())
      and membership.role in ('owner', 'admin')
  );
$$;

revoke all on function public.is_business_member(uuid) from public;
revoke all on function public.is_business_admin(uuid) from public;
grant execute on function public.is_business_member(uuid) to authenticated;
grant execute on function public.is_business_admin(uuid) to authenticated;

alter table public.businesses enable row level security;
alter table public.business_memberships enable row level security;

create policy "Members can read their businesses"
  on public.businesses
  for select
  to authenticated
  using (public.is_business_member(id));

create policy "Admins can update their businesses"
  on public.businesses
  for update
  to authenticated
  using (public.is_business_admin(id))
  with check (public.is_business_admin(id));

create policy "Users can read their own memberships"
  on public.business_memberships
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or public.is_business_admin(business_id)
  );

-- Business creation and owner membership happen atomically. Membership writes
-- remain unavailable to clients until the invitation/role-management workflow
-- is implemented with explicit authorization checks.
create or replace function public.create_business(p_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_business_id uuid;
  v_user_id uuid := (select auth.uid());
  v_name text := trim(coalesce(p_name, ''));
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if char_length(v_name) < 2 or char_length(v_name) > 120 then
    raise exception 'Business name must contain between 2 and 120 characters'
      using errcode = '22023';
  end if;

  insert into public.businesses (name, created_by)
  values (v_name, v_user_id)
  returning id into v_business_id;

  insert into public.business_memberships (business_id, user_id, role)
  values (v_business_id, v_user_id, 'owner');

  return v_business_id;
end;
$$;

revoke all on function public.create_business(text) from public;
revoke all on function public.create_business(text) from anon;
grant execute on function public.create_business(text) to authenticated;

comment on table public.businesses is
  'Tenant/workspace root. Every business-owned record must reference this table.';
comment on table public.business_memberships is
  'Maps authenticated users to businesses and their workspace role.';
comment on function public.create_business(text) is
  'Atomically creates a business and grants its creator the owner role.';
