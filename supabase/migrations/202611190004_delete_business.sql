-- Allow a workspace owner to permanently delete an accidental business.
-- The database checks ownership independently of the UI/server action.
-- Related memberships and module installations cascade from businesses.

create or replace function public.delete_business(p_business_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_role text;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select membership.role
    into v_role
  from public.business_memberships as membership
  where membership.business_id = p_business_id
    and membership.user_id = v_user_id
  for update;

  if v_role is distinct from 'owner' then
    raise exception 'Only the business owner can delete this workspace'
      using errcode = '42501';
  end if;

  delete from public.businesses
  where id = p_business_id;
end;
$$;

revoke all on function public.delete_business(uuid) from public;
revoke all on function public.delete_business(uuid) from anon;
grant execute on function public.delete_business(uuid) to authenticated;

comment on function public.delete_business(uuid) is
  'Permanently deletes a business after verifying the caller is its owner. Tenant-owned child rows cascade.';
