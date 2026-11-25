-- RLS regression tests for the initial multi-tenant boundary.
-- Run with: npx supabase test db

create extension if not exists pgtap with schema extensions;

begin;
select extensions.plan(24);

insert into auth.users (
  id, aud, role, email, encrypted_password, confirmed_at,
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
select set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
select set_config('test.created_business_id', public.create_business('Workspace A', 'butcher')::text, true);
select extensions.is((select industry from public.businesses where id = current_setting('test.created_business_id')::uuid), 'butcher', 'workspace stores its selected industry');
select extensions.is((select count(*)::integer from public.business_modules where business_id = current_setting('test.created_business_id')::uuid), 6, 'new butcher workspace receives its recommended starter modules');
select extensions.throws_ok($$ select public.create_business('Invalid industry workspace', 'run_anything') $$, '22023', null, 'RPC rejects an industry outside the allowlist');
reset role;

-- Trusted fixture setup: a second tenant, plus a member and admin in A.
insert into public.businesses (id, name, created_by)
values ('50000000-0000-4000-8000-000000000005', 'Workspace B', '20000000-0000-4000-8000-000000000002');

insert into public.business_memberships (business_id, user_id, role)
values
  ('50000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000002', 'owner'),
  (current_setting('test.created_business_id')::uuid, '30000000-0000-4000-8000-000000000003', 'member'),
  (current_setting('test.created_business_id')::uuid, '40000000-0000-4000-8000-000000000004', 'admin');

-- Anonymous access. Clear both JWT claim formats so the previous owner context
-- cannot leak into this role after SET LOCAL ROLE.
set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select extensions.is((select count(*)::integer from public.businesses), 0, 'anonymous users cannot read businesses');
select extensions.is((select count(*)::integer from public.business_memberships), 0, 'anonymous users cannot read memberships');
select extensions.is((select count(*)::integer from public.business_modules), 0, 'anonymous users cannot read business modules');
select extensions.throws_ok($$ select public.create_business('Anonymous workspace', 'other') $$, '42501', null, 'anonymous users cannot create a business');
reset role;

-- Owner A is isolated from tenant B and can inspect its own workspace.
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
select extensions.is((select count(*)::integer from public.businesses), 1, 'owner A sees only its own business');
select extensions.is((select name from public.businesses limit 1), 'Workspace A', 'owner A sees the correct business');
select extensions.is((select count(*)::integer from public.business_memberships where business_id = current_setting('test.created_business_id')::uuid), 3, 'owner A can read memberships in its workspace');
select extensions.is((select count(*)::integer from public.business_modules where business_id = current_setting('test.created_business_id')::uuid), 6, 'owner A can read its installed modules');
reset role;

-- A regular member can read its workspace and own membership, but cannot write.
set local role authenticated;
select set_config('request.jwt.claim.sub', '30000000-0000-4000-8000-000000000003', true);
select set_config('request.jwt.claims', '{"sub":"30000000-0000-4000-8000-000000000003","role":"authenticated"}', true);
select extensions.is((select count(*)::integer from public.businesses), 1, 'member sees its own workspace');
select extensions.is((select count(*)::integer from public.business_memberships), 1, 'member sees only its own membership');
select extensions.is((select count(*)::integer from public.business_modules where business_id = current_setting('test.created_business_id')::uuid), 6, 'member can read modules in its workspace');

update public.businesses
set name = 'Unauthorized rename'
where id = current_setting('test.created_business_id')::uuid;
select extensions.is(
  (select count(*)::integer from public.businesses
   where id = current_setting('test.created_business_id')::uuid and name = 'Workspace A'),
  1,
  'member cannot update business details'
);

update public.business_modules set enabled = false
where business_id = current_setting('test.created_business_id')::uuid and module_slug = 'inventory';
select extensions.is((select count(*)::integer from public.business_modules where business_id = current_setting('test.created_business_id')::uuid and module_slug = 'inventory' and enabled), 1, 'member cannot disable a module');

select extensions.throws_ok(
  $$ insert into public.business_memberships (business_id, user_id, role)
     values (current_setting('test.created_business_id')::uuid, '20000000-0000-4000-8000-000000000002', 'admin') $$,
  '42501',
  null,
  'member cannot insert or elevate memberships'
);

delete from public.business_memberships
where business_id = current_setting('test.created_business_id')::uuid
  and user_id = '30000000-0000-4000-8000-000000000003';
select extensions.is(
  (select count(*)::integer from public.business_memberships
   where business_id = current_setting('test.created_business_id')::uuid
     and user_id = '30000000-0000-4000-8000-000000000003'),
  1,
  'member cannot delete memberships'
);
reset role;

-- An admin can inspect workspace memberships and update business details.
set local role authenticated;
select set_config('request.jwt.claim.sub', '40000000-0000-4000-8000-000000000004', true);
select set_config('request.jwt.claims', '{"sub":"40000000-0000-4000-8000-000000000004","role":"authenticated"}', true);
select extensions.is((select count(*)::integer from public.business_memberships where business_id = current_setting('test.created_business_id')::uuid), 3, 'admin can read all memberships in its workspace');

update public.businesses
set name = 'Workspace A updated'
where id = current_setting('test.created_business_id')::uuid;
select extensions.is(
  (select count(*)::integer from public.businesses
   where id = current_setting('test.created_business_id')::uuid and name = 'Workspace A updated'),
  1,
  'admin can update business details'
);

update public.business_modules set enabled = false
where business_id = current_setting('test.created_business_id')::uuid and module_slug = 'inventory';
select extensions.is((select count(*)::integer from public.business_modules where business_id = current_setting('test.created_business_id')::uuid and module_slug = 'inventory' and enabled), 0, 'admin can disable a module');
reset role;

-- Owner B cannot see tenant A.
set local role authenticated;
select set_config('request.jwt.claim.sub', '20000000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claims', '{"sub":"20000000-0000-4000-8000-000000000002","role":"authenticated"}', true);
select extensions.is((select count(*)::integer from public.businesses), 1, 'owner B sees only its own business');
select extensions.is((select count(*)::integer from public.business_memberships where business_id = current_setting('test.created_business_id')::uuid), 0, 'owner B cannot read memberships from workspace A');
select extensions.is((select count(*)::integer from public.business_modules where business_id = current_setting('test.created_business_id')::uuid), 0, 'owner B cannot read modules from workspace A');
reset role;

select * from extensions.finish();
rollback;
