-- Restrict subscription access to authenticated reads only.
-- Subscription writes are reserved for trusted server-side operations.

revoke all on public.business_subscriptions
from public, anon, authenticated;

grant select on public.business_subscriptions
to authenticated;