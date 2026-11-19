-- Per-business module installations. The executable catalog remains first-party
-- code; this table stores only validated module identifiers and tenant settings.

create table public.business_modules (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  module_slug text not null check (module_slug in (
    'sales', 'inventory', 'purchasing', 'suppliers', 'customers',
    'appointments', 'projects', 'time_tracking', 'proposals', 'services',
    'waste_tracking', 'menu_costing', 'production', 'work_orders', 'tasks'
  )),
  enabled boolean not null default true,
  config jsonb not null default '{}'::jsonb check (jsonb_typeof(config) = 'object'),
  installed_version text not null default '1.0.0',
  installed_by uuid references auth.users(id) on delete set null,
  installed_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, module_slug)
);

create index business_modules_business_enabled_idx
  on public.business_modules (business_id, enabled);

create trigger business_modules_touch_updated_at
before update on public.business_modules
for each row execute function public.touch_updated_at();

alter table public.business_modules enable row level security;

revoke all on public.business_modules from public, anon;
grant select, insert, update on public.business_modules to authenticated;

create policy "Members can read their business modules"
  on public.business_modules for select to authenticated
  using (public.is_business_member(business_id));

create policy "Admins can install business modules"
  on public.business_modules for insert to authenticated
  with check (public.is_business_admin(business_id));

create policy "Admins can update business modules"
  on public.business_modules for update to authenticated
  using (public.is_business_admin(business_id))
  with check (public.is_business_admin(business_id));

create or replace function public.seed_business_modules()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_modules text[];
  v_slug text;
begin
  v_modules := case new.industry
    when 'retail' then array['sales', 'inventory', 'purchasing', 'suppliers', 'customers', 'tasks']
    when 'food_service' then array['sales', 'inventory', 'purchasing', 'suppliers', 'waste_tracking', 'menu_costing', 'tasks']
    when 'butcher' then array['sales', 'inventory', 'purchasing', 'suppliers', 'waste_tracking', 'tasks']
    when 'greengrocer' then array['sales', 'inventory', 'purchasing', 'suppliers', 'waste_tracking', 'tasks']
    when 'beauty' then array['appointments', 'services', 'customers', 'inventory', 'tasks']
    when 'healthcare' then array['appointments', 'services', 'customers', 'tasks']
    when 'professional_services' then array['customers', 'projects', 'proposals', 'services', 'tasks']
    when 'freelancer' then array['customers', 'projects', 'time_tracking', 'proposals', 'tasks']
    when 'construction' then array['projects', 'work_orders', 'purchasing', 'suppliers', 'tasks']
    when 'manufacturing' then array['production', 'inventory', 'purchasing', 'suppliers', 'work_orders', 'tasks']
    else array['customers', 'tasks']
  end;

  foreach v_slug in array v_modules loop
    insert into public.business_modules (business_id, module_slug, installed_by)
    values (new.id, v_slug, new.created_by)
    on conflict (business_id, module_slug) do nothing;
  end loop;
  return new;
end;
$$;

revoke all on function public.seed_business_modules() from public, anon, authenticated;

create trigger businesses_seed_modules
after insert on public.businesses
for each row execute function public.seed_business_modules();

insert into public.business_modules (business_id, module_slug, installed_by)
select business.id, recommended.module_slug, business.created_by
from public.businesses as business
cross join lateral unnest(
  case business.industry
    when 'retail' then array['sales', 'inventory', 'purchasing', 'suppliers', 'customers', 'tasks']
    when 'food_service' then array['sales', 'inventory', 'purchasing', 'suppliers', 'waste_tracking', 'menu_costing', 'tasks']
    when 'butcher' then array['sales', 'inventory', 'purchasing', 'suppliers', 'waste_tracking', 'tasks']
    when 'greengrocer' then array['sales', 'inventory', 'purchasing', 'suppliers', 'waste_tracking', 'tasks']
    when 'beauty' then array['appointments', 'services', 'customers', 'inventory', 'tasks']
    when 'healthcare' then array['appointments', 'services', 'customers', 'tasks']
    when 'professional_services' then array['customers', 'projects', 'proposals', 'services', 'tasks']
    when 'freelancer' then array['customers', 'projects', 'time_tracking', 'proposals', 'tasks']
    when 'construction' then array['projects', 'work_orders', 'purchasing', 'suppliers', 'tasks']
    when 'manufacturing' then array['production', 'inventory', 'purchasing', 'suppliers', 'work_orders', 'tasks']
    else array['customers', 'tasks']
  end
) as recommended(module_slug)
on conflict (business_id, module_slug) do nothing;

comment on table public.business_modules is
  'Enabled/disabled first-party module installations scoped to a business. Disabling never deletes module data.';
