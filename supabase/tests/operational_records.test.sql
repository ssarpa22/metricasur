create extension if not exists pgtap with schema extensions;
begin;
select extensions.plan(4);
insert into auth.users (
 id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at
) values
 ('60000000-0000-4000-8000-000000000006','authenticated','authenticated','records-owner@example.test','',now(),'{"provider":"email","providers":["email"]}','{}',now(),now()),
 ('70000000-0000-4000-8000-000000000007','authenticated','authenticated','records-outsider@example.test','',now(),'{"provider":"email","providers":["email"]}','{}',now(),now());

set local role authenticated;
select set_config('request.jwt.claim.sub','60000000-0000-4000-8000-000000000006',true);
select set_config('request.jwt.claims','{"sub":"60000000-0000-4000-8000-000000000006","role":"authenticated"}',true);
select set_config('test.records_business_id',public.create_business('Records workspace','butcher')::text,true);
insert into public.business_records (business_id,module_slug,title,created_by)
values (current_setting('test.records_business_id')::uuid,'sales','Venta de prueba','60000000-0000-4000-8000-000000000006');
select extensions.is((select count(*)::integer from public.business_records where business_id=current_setting('test.records_business_id')::uuid),1,'business owner can create and read an operational record');
update public.business_records set status='completed' where business_id=current_setting('test.records_business_id')::uuid and module_slug='sales';
select extensions.is((select count(*)::integer from public.business_records where business_id=current_setting('test.records_business_id')::uuid and status='completed'),1,'business owner can update an operational record');
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub','70000000-0000-4000-8000-000000000007',true);
select set_config('request.jwt.claims','{"sub":"70000000-0000-4000-8000-000000000007","role":"authenticated"}',true);
select extensions.is((select count(*)::integer from public.business_records),0,'unrelated user cannot read another business operational records');
reset role;

set local role anon;
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claims','{"role":"anon"}',true);
select extensions.throws_ok($ select count(*) from public.business_records $,'42501',null,'anonymous users cannot read operational records');
reset role;
select * from extensions.finish();
rollback;
