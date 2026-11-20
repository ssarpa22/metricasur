-- Generic, tenant-scoped operational records used by first-party modules.
create table public.business_records (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  module_slug text not null check (module_slug in (
    'sales','inventory','purchasing','suppliers','customers','appointments',
    'projects','time_tracking','proposals','services','waste_tracking',
    'menu_costing','production','work_orders','tasks'
  )),
  title text not null check (char_length(title) between 1 and 160),
  description text not null default '' check (char_length(description) <= 4000),
  status text not null default 'open' check (status in ('open','in_progress','completed','cancelled')),
  amount numeric(14,2) check (amount is null or amount >= 0),
  quantity numeric(14,3) check (quantity is null or quantity >= 0),
  due_date date,
  category text not null default '' check (char_length(category) <= 80),
  reference text not null default '' check (char_length(reference) <= 120),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index business_records_business_module_created_idx
  on public.business_records (business_id, module_slug, created_at desc);
create index business_records_business_due_idx
  on public.business_records (business_id, due_date) where due_date is not null;
create trigger business_records_touch_updated_at
before update on public.business_records
for each row execute function public.touch_updated_at();

alter table public.business_records enable row level security;
revoke all on public.business_records from public, anon;
grant select, insert, update, delete on public.business_records to authenticated;

create policy "Members can read business records"
  on public.business_records for select to authenticated
  using (public.is_business_member(business_id));
create policy "Members can create business records"
  on public.business_records for insert to authenticated
  with check (
    public.is_business_member(business_id)
    and created_by = (select auth.uid())
    and exists (
      select 1 from public.business_modules bm
      where bm.business_id = business_records.business_id
        and bm.module_slug = business_records.module_slug
        and bm.enabled
    )
  );
create policy "Members can update business records"
  on public.business_records for update to authenticated
  using (
    public.is_business_member(business_id)
    and exists (
      select 1 from public.business_modules bm
      where bm.business_id = business_records.business_id
        and bm.module_slug = business_records.module_slug
        and bm.enabled
    )
  )
  with check (
    public.is_business_member(business_id)
    and exists (
      select 1 from public.business_modules bm
      where bm.business_id = business_records.business_id
        and bm.module_slug = business_records.module_slug
        and bm.enabled
    )
  );
create policy "Members can delete business records"
  on public.business_records for delete to authenticated
  using (
    public.is_business_member(business_id)
    and exists (
      select 1 from public.business_modules bm
      where bm.business_id = business_records.business_id
        and bm.module_slug = business_records.module_slug
        and bm.enabled
    )
  );

comment on table public.business_records is
  'Shared operational record envelope for first-party modules; module-specific fields live in validated columns and metadata.';
