-- Account-level subscription regression tests. Run with: npx supabase test db
create extension if not exists pgtap with schema extensions;

begin;
select extensions.plan(8);

insert into auth.users (
  id, aud, role, email, encrypted_password, confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values (
  '91000000-0000-4000-9000-000000000001', 'authenticated', 'authenticated',
  'subscription-owner@example.test', '', now(),
  '{"provider":"email","providers":["email"]}', '{}', now(), now()
), (
  '91000000-0000-4000-9000-000000000002', 'authenticated', 'authenticated',
  'subscription-outsider@example.test', '', now(),
  '{"provider":"email","providers":["email"]}', '{}', now(), now()
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '91000000-0000-4000-9000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"91000000-0000-4000-9000-000000000001","role":"authenticated"}', true);

select extensions.is(
  (select plan from public.account_subscriptions where user_id = auth.uid()),
  'free',
  'new accounts receive one Free subscription'
);

select set_config(
  'test.subscription_business_id',
  public.create_business('Subscription workspace', 'retail')::text,
  true
);

select extensions.is(
  (select count(*)::integer from public.account_subscriptions where user_id = auth.uid()),
  1,
  'creating a business does not create another subscription'
);

select extensions.is(
  (select business_count from public.get_account_subscription_context(auth.uid())),
  1,
  'account context reports aggregate business usage'
);

select extensions.throws_ok(
  $ select * from public.get_account_subscription_context('91000000-0000-4000-9000-000000000002'::uuid) $,
  '42501', null,
  'an account cannot read another unrelated account subscription context'
);

select extensions.throws_ok(
  $$ select public.create_business('Second workspace', 'retail') $$,
  '42501', null,
  'Free account cannot bypass its one-business limit through the RPC'
);

select extensions.throws_ok(
  $$ update public.account_subscriptions set plan = 'business' where user_id = auth.uid() $$,
  '42501', null,
  'authenticated clients cannot change account subscription privileges'
);

select extensions.is(
  (select count(*)::integer from public.businesses where created_by = auth.uid()),
  1,
  'the account owns exactly one business after the rejected second creation'
);
reset role;

set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select extensions.throws_ok(
  $$ select count(*) from public.account_subscriptions $$,
  '42501', null,
  'anonymous users cannot read account subscriptions'
);
reset role;

select * from extensions.finish();
rollback;
