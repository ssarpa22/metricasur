-- Add a controlled industry identifier to each business workspace.
-- Existing workspaces remain valid and are classified as "other" until updated.

alter table public.businesses
  add column industry text not null default 'other';

alter table public.businesses
  add constraint businesses_industry_check
  check (industry in (
    'retail',
    'food_service',
    'butcher',
    'greengrocer',
    'beauty',
    'healthcare',
    'professional_services',
    'freelancer',
    'construction',
    'manufacturing',
    'other'
  ));

-- Replace the original one-argument RPC so every new workspace supplies
-- an industry identifier that is checked again inside the database.
drop function public.create_business(text);

create function public.create_business(p_name text, p_industry text)
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

  if p_industry is null or p_industry not in (
    'retail',
    'food_service',
    'butcher',
    'greengrocer',
    'beauty',
    'healthcare',
    'professional_services',
    'freelancer',
    'construction',
    'manufacturing',
    'other'
  ) then
    raise exception 'Invalid business industry' using errcode = '22023';
  end if;

  insert into public.businesses (name, industry, created_by)
  values (v_name, p_industry, v_user_id)
  returning id into v_business_id;

  insert into public.business_memberships (business_id, user_id, role)
  values (v_business_id, v_user_id, 'owner');

  return v_business_id;
end;
$$;

revoke all on function public.create_business(text, text) from public;
revoke all on function public.create_business(text, text) from anon;
grant execute on function public.create_business(text, text) to authenticated;

comment on column public.businesses.industry is
  'Controlled industry slug used to select the business workspace experience and modules.';
comment on function public.create_business(text, text) is
  'Atomically creates a business with a validated industry and grants its creator the owner role.';
