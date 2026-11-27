-- Persist tutorial choices per authenticated account, across browsers and devices.
create table public.user_tutorial_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  tutorial_dismissed boolean not null default false,
  tutorial_completed boolean not null default false,
  updated_at timestamptz not null default now()
);

create trigger user_tutorial_preferences_touch_updated_at
before update on public.user_tutorial_preferences
for each row execute function public.touch_updated_at();

alter table public.user_tutorial_preferences enable row level security;
revoke all on public.user_tutorial_preferences from public, anon, authenticated;
grant select, insert, update on public.user_tutorial_preferences to authenticated;

create policy "Users can read their own tutorial preferences"
  on public.user_tutorial_preferences
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can create their own tutorial preferences"
  on public.user_tutorial_preferences
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "Users can update their own tutorial preferences"
  on public.user_tutorial_preferences
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
