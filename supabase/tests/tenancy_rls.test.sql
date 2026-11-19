-- RLS regression tests for the initial multi-tenant boundary.
-- Run with: npx supabase test db

create extension if not exists pgtap with schema extensions;

begin;
select extensions.plan(15);

insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('10000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'rls-owner-a@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('20000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'rls-owner-b@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('30000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'rls-member@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('40000000-0000-4000-8000-000000000004', 'authenticated', 'authenticated', 'rls-admin@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

-- User A creates its workspace through the client-facing RPC.
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
select set_config('test.created_business_id', public.create_business('Workspace A')::text, true);
reset role;

-- Trusted fixture setup: a second tenant, plus a member and admin in A.
insert into public.businesses (id, name, created_by)
values ('50000000-0000-4000-8000-000000000005', 'Workspace B', '20000000-0000-4000-8000-000000000002');

insert into public.business_memberships (business_id, user_id, role)
values
  ('50000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000002', 'owner'),
  (current_setting('test.created_business_id')::uuid, '30000000-0000-4000-8000-000000000003', 'member'),
  (current_setting('test.created_business_id')::uuid, '40000000-0000-4000-8000-000000000004', 'admin');

-- Anonymous access.
set local role anon;
select extensions.is((select count(*)::integer from public.businesses), 0, 'anonymous users cannot read businesses');
select extensions.is((select count(*)::integer from public.business_memberships), 0, 'anonymous users cannot read memberships');
select extensions.throws_ok($$ select public.create_business('Anonymous workspace') $$, '42501', null, 'anonymous users cannot create a business');
reset role;

-- Owner A is isolated from tenant B and can inspect its own workspace.
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
select extensions.is((select count(*)::integer from public.businesses), 1, 'owner A sees only its own business');
select extensions.is((select name from public.businesses limit 1), 'Workspace A', 'owner A sees the correct business');
select extensions.is((select count(*)::integer from public.business_memberships where business_id = current_setting('test.created_business_id')::uuid), 3, 'owner A can read memberships in its workspace');
reset role;

-- A regular member can read its workspace and own membership, but cannot write.
set local role authenticated;
select set_config('request.jwt.claim.sub', '30000000-0000-4000-8000-000000000003', true);
select extensions.is((select count(*)::integer from public.businesses), 1, 'member sees its own workspace');
select extensions.is((select count(*)::integer from public.business_memberships), 1, 'member sees only its own membership');
select extensions.is((with changed as (update public.businesses set name = 'Unauthorized rename' where id = current_setting('test.created_business_id')::uuid returning 1) select count(*)::integer from changed), 0, 'member cannot update business details');
select extensions.is((with inserted as (insert into public.business_memberships (business_id, user_id, role) values (current_setting('test.created_business_id')::uuid, '20000000-0000-4000-8000-000000000002', 'admin') returning 1) select count(*)::integer from inserted), 0, 'member cannot insert or elevate memberships');
select extensions.is((with deleted as (delete from public.business_memberships where business_id = current_setting('test.created_business_id')::uuid and user_id = '30000000-0000-4000-8000-000000000003' returning 1) select count(*)::integer from deleted), 0, 'member cannot delete memberships');
reset role;

-- An admin can inspect workspace memberships and update business details.
set local role authenticated;
select set_config('request.jwt.claim.sub', '40000000-0000-4000-8000-000000000004', true);
select extensions.is((select count(*)::integer from public.business_memberships where business_id = current_setting('test.created_business_id')::uuid), 3, 'admin can read all memberships in its workspace');
select extensions.is((with changed as (update public.businesses set name = 'Workspace A updated' where id = current_setting('test.created_business_id')::uuid returning 1) select count(*)::integer from changed), 1, 'admin can update business details');
reset role;

-- Owner B cannot see tenant A.
set local role authenticated;
select set_config('request.jwt.claim.sub', '20000000-0000-4000-8000-000000000002', true);
select extensions.is((select count(*)::integer from public.businesses), 1, 'owner B sees only its own business');
select extensions.is((select count(*)::integer from public.business_memberships where business_id = current_setting('test.created_business_id')::uuid), 0, 'owner B cannot read memberships from workspace A');
reset role;

select * from extensions.finish();
rollback;
