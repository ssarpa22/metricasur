-- Subscription foundation tests. Run with: npx supabase test db
create extension if not exists pgtap with schema extensions;

begin;
select extensions.plan(6);

insert into auth.users (
  id, aud, role, email, encrypted_password, confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values (
  '91000000-0000-4000-9000-000000000001', 'authenticated', 'authenticated',
  'subscription-owner@example.test', '', now(),
  '{"provider":"email","providers":["email"]}', '{}', now(), now()
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '91000000-0000-4000-9000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"91000000-0000-4000-9000-000000000001","role":"authenticated"}', true);

select set_config('test.subscription_business_id', public.create_business('Subscription workspace', 'retail')::text, true);
select extensions.is(
  (select plan from public.business_subscriptions where business_id = current_setting('test.subscription_business_id')::uuid),
  'free',
  'new businesses receive the Free plan'
);
select extensions.is(
  (select count(*)::integer from public.business_subscriptions where business_id = current_setting('test.subscription_business_id')::uuid),
  1,
  'each business has one subscription row'
);
select extensions.is(
  (select free_plan_grandfathered from public.business_subscriptions where business_id = current_setting('test.subscription_business_id')::uuid),
  false,
  'new Free businesses are not grandfathered'
);

select extensions.throws_ok(
  $$ update public.business_subscriptions set plan = 'business' where business_id = current_setting('test.subscription_business_id')::uuid $$,
  '42501', null,
  'authenticated clients cannot change subscription privileges'
);

select extensions.is(
  (select count(*)::integer from public.business_subscriptions where business_id = current_setting('test.subscription_business_id')::uuid and status = 'active'),
  1,
  'new subscriptions start active'
);
reset role;

set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select extensions.throws_ok(
  $$ select count(*) from public.business_subscriptions $$,
  '42501', null,
  'anonymous users cannot read subscriptions'
);reset role;

select * from extensions.finish();
rollback;
