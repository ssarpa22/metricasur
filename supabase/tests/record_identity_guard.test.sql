-- Database integrity test for immutable tenant/module/creator identity.
-- Run with: npx supabase test db
create extension if not exists pgtap with schema extensions;

begin;
select extensions.plan(4);

insert into auth.users (
  id, aud, role, email, encrypted_password, confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values (
  '92000000-0000-4000-9000-000000000001', 'authenticated', 'authenticated',
  'identity-guard@example.test', '', now(),
  '{"provider":"email","providers":["email"]}', '{}', now(), now()
);

insert into public.businesses (id, name, created_by, industry)
values ('92000000-0000-4000-9000-000000000002', 'Guard workspace', '92000000-0000-4000-9000-000000000001', 'retail');
insert into public.business_records (id, business_id, module_slug, title, created_by)
values ('92000000-0000-4000-9000-000000000003', '92000000-0000-4000-9000-000000000002', 'sales', 'Guard record', '92000000-0000-4000-9000-000000000001');

select extensions.throws_ok(
  $$ update public.business_records set business_id = '92000000-0000-4000-9000-000000000004' where id = '92000000-0000-4000-9000-000000000003' $$,
  '42501', null, 'business ownership cannot be changed'
);
select extensions.throws_ok(
  $$ update public.business_records set module_slug = 'inventory' where id = '92000000-0000-4000-9000-000000000003' $$,
  '42501', null, 'module identity cannot be changed'
);
select extensions.throws_ok(
  $$ update public.business_records set created_at = now() + interval '1 year' where id = '92000000-0000-4000-9000-000000000003' $$,
  '42501', null, 'record creation time cannot be changed'
);
select extensions.is(
  (select business_id from public.business_records where id = '92000000-0000-4000-9000-000000000003'),
  '92000000-0000-4000-9000-000000000002'::uuid,
  'record identity remains unchanged after rejected updates'
);

select * from extensions.finish();
rollback;
