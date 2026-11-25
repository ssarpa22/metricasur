
-- Cross-tenant isolation tests for operational records.
-- Run with: npx supabase test db

create extension if not exists pgtap with schema extensions;

begin;

select extensions.plan(6);

-- Two isolated test users.
insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  (
    '81000000-0000-4000-8000-000000000001',
    'authenticated', 'authenticated',
    'isolation-owner-a@example.test', '', now(),
    '{"provider":"email","providers":["email"]}', '{}', now(), now()
  ),
  (
    '82000000-0000-4000-8000-000000000002',
    'authenticated', 'authenticated',
    'isolation-owner-b@example.test', '', now(),
    '{"provider":"email","providers":["email"]}', '{}', now(), now()
  );

-- Owner A creates business A and its operational record.
set local role authenticated;

select set_config(
  'request.jwt.claim.sub',
  '81000000-0000-4000-8000-000000000001',
  true
);

select set_config(
  'request.jwt.claims',
  '{"sub":"81000000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);

select set_config(
  'test.business_a_id',
  public.create_business('Isolation Business A', 'retail')::text,
  true
);

insert into public.business_records (
  business_id, module_slug, title, created_by
)
values (
  current_setting('test.business_a_id')::uuid,
  'sales',
  'Private sale A',
  '81000000-0000-4000-8000-000000000001'
);

select set_config(
  'test.record_a_id',
  (
    select id::text
    from public.business_records
    where business_id = current_setting('test.business_a_id')::uuid
      and title = 'Private sale A'
  ),
  true
);

select extensions.is(
  (
    select count(*)::integer
    from public.business_records
    where id = current_setting('test.record_a_id')::uuid
  ),
  1,
  'owner A can create and read its operational record'
);

reset role;

-- Owner B creates a separate business and its own record.
set local role authenticated;

select set_config(
  'request.jwt.claim.sub',
  '82000000-0000-4000-8000-000000000002',
  true
);

select set_config(
  'request.jwt.claims',
  '{"sub":"82000000-0000-4000-8000-000000000002","role":"authenticated"}',
  true
);

select set_config(
  'test.business_b_id',
  public.create_business('Isolation Business B', 'retail')::text,
  true
);

insert into public.business_records (
  business_id, module_slug, title, created_by
)
values (
  current_setting('test.business_b_id')::uuid,
  'sales',
  'Private sale B',
  '82000000-0000-4000-8000-000000000002'
);

select extensions.is(
  (
    select count(*)::integer
    from public.business_records
    where business_id = current_setting('test.business_b_id')::uuid
  ),
  1,
  'owner B can create its own operational record'
);

-- B cannot read A's record.
select extensions.is(
  (
    select count(*)::integer
    from public.business_records
    where id = current_setting('test.record_a_id')::uuid
  ),
  0,
  'owner B cannot read owner A operational records'
);

-- B attempts to modify A's record. RLS must hide the target row.
update public.business_records
set status = 'completed'
where id = current_setting('test.record_a_id')::uuid;

reset role;

-- A verifies that B's update did not change the record.
set local role authenticated;

select set_config(
  'request.jwt.claim.sub',
  '81000000-0000-4000-8000-000000000001',
  true
);

select set_config(
  'request.jwt.claims',
  '{"sub":"81000000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);

select extensions.is(
  (
    select count(*)::integer
    from public.business_records
    where id = current_setting('test.record_a_id')::uuid
      and status = 'open'
  ),
  1,
  'owner B cannot modify owner A operational records'
);

reset role;

-- B attempts to delete A's record.
set local role authenticated;

select set_config(
  'request.jwt.claim.sub',
  '82000000-0000-4000-8000-000000000002',
  true
);

select set_config(
  'request.jwt.claims',
  '{"sub":"82000000-0000-4000-8000-000000000002","role":"authenticated"}',
  true
);

delete from public.business_records
where id = current_setting('test.record_a_id')::uuid;

reset role;

-- A verifies that its record still exists.
set local role authenticated;

select set_config(
  'request.jwt.claim.sub',
  '81000000-0000-4000-8000-000000000001',
  true
);

select set_config(
  'request.jwt.claims',
  '{"sub":"81000000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);

select extensions.is(
  (
    select count(*)::integer
    from public.business_records
    where id = current_setting('test.record_a_id')::uuid
  ),
  1,
  'owner B cannot delete owner A operational records'
);

reset role;

-- B attempts to insert a record into A's business.
set local role authenticated;

select set_config(
  'request.jwt.claim.sub',
  '82000000-0000-4000-8000-000000000002',
  true
);

select set_config(
  'request.jwt.claims',
  '{"sub":"82000000-0000-4000-8000-000000000002","role":"authenticated"}',
  true
);

select extensions.throws_ok(
  $$
    insert into public.business_records (
      business_id, module_slug, title, created_by
    )
    values (
      current_setting('test.business_a_id')::uuid,
      'sales',
      'Unauthorized cross-tenant sale',
      '82000000-0000-4000-8000-000000000002'
    )
  $$,
  '42501',
  null,
  'owner B cannot insert records into owner A business'
);

reset role;

select * from extensions.finish();

rollback;
