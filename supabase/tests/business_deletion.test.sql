-- Regression tests for owner-only business deletion and cascading cleanup.
-- Run with: npx supabase test db

create extension if not exists pgtap with schema extensions;

begin;
select extensions.plan(5);

insert into auth.users (
  id, aud, role, email, encrypted_password, confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('61000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'delete-owner@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('62000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'delete-admin@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('63000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'delete-member@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

insert into public.businesses (id, name, created_by, industry)
values ('64000000-0000-4000-8000-000000000004', 'Accidental workspace', '61000000-0000-4000-8000-000000000001', 'butcher');

insert into public.business_memberships (business_id, user_id, role)
values
  ('64000000-0000-4000-8000-000000000004', '61000000-0000-4000-8000-000000000001', 'owner'),
  ('64000000-0000-4000-8000-000000000004', '62000000-0000-4000-8000-000000000002', 'admin'),
  ('64000000-0000-4000-8000-000000000004', '63000000-0000-4000-8000-000000000003', 'member');

set local role authenticated;
select set_config('request.jwt.claim.sub', '62000000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claims', '{"sub":"62000000-0000-4000-8000-000000000002","role":"authenticated"}', true);
select extensions.throws_ok(
  $$ select public.delete_business('64000000-0000-4000-8000-000000000004') $$,
  '42501', null, 'an admin cannot delete a workspace'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '63000000-0000-4000-8000-000000000003', true);
select set_config('request.jwt.claims', '{"sub":"63000000-0000-4000-8000-000000000003","role":"authenticated"}', true);
select extensions.throws_ok(
  $$ select public.delete_business('64000000-0000-4000-8000-000000000004') $$,
  '42501', null, 'a regular member cannot delete a workspace'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '61000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"61000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
select public.delete_business('64000000-0000-4000-8000-000000000004');
select extensions.is((select count(*)::integer from public.businesses where id = '64000000-0000-4000-8000-000000000004'), 0, 'the owner can permanently delete the workspace');
select extensions.is((select count(*)::integer from public.business_memberships where business_id = '64000000-0000-4000-8000-000000000004'), 0, 'deletion cascades to all workspace memberships');
select extensions.is((select count(*)::integer from public.business_modules where business_id = '64000000-0000-4000-8000-000000000004'), 0, 'deletion cascades to installed modules');
reset role;

select * from extensions.finish();
rollback;
