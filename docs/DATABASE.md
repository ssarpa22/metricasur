# Database foundation

## Scope
The migrations establish the tenant boundary, controlled industry classification, and per-business module installations:

- `businesses` is the workspace/tenant root.
- `businesses.industry` stores a controlled industry slug, never arbitrary free text.
- `business_memberships` maps Supabase Auth users to businesses and their workspace role.
- `business_modules` stores enabled/disabled first-party modules for each workspace.
- A user can belong to multiple businesses; each business can have multiple users.
- Membership roles are initially `owner`, `admin`, and `member`.
- Row Level Security (RLS) is enabled on all tenant tables.
- The `create_business(name, industry)` RPC validates the industry and creates the business and owner membership atomically. A database trigger then seeds its recommended modules.

## Apply locally

For an existing local database, apply only pending migrations:

```powershell
npx supabase migration up --local
```

Avoid `npx supabase db reset` when you want to preserve local users and workspace data.

For a fresh local setup, start Supabase and apply the complete migration history:

```powershell
npx supabase start
npx supabase db reset
```

For a linked hosted project, link it explicitly and review pending migrations before applying:

```powershell
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase migration list
npx supabase db push --dry-run
npx supabase db push
```

Do not commit project credentials or database passwords.

## Test authorization, tenant isolation, and module lifecycle

With the local Supabase stack running and migrations applied, run:

```powershell
npx supabase test db
```

The pgTAP suite checks anonymous access, atomic business creation, tenant isolation, membership visibility, role permissions, industry validation, module seeding, and module enablement authorization.

## Authorization model

| Operation | Initial policy |
| --- | --- |
| Read a business | Any active member |
| Update business details | Owner or admin |
| Read own membership | The member |
| Read all memberships in a workspace | Owner or admin |
| Read installed modules | Any active member |
| Install, enable, or disable modules | Owner or admin |
| Add/remove members or change roles | Not exposed to clients yet |
| Delete a business | Not exposed |

The membership helper functions use `SECURITY DEFINER` with an empty `search_path` and fully qualified table names to avoid recursive RLS evaluation and search-path attacks.

## Application workspace context

The Next.js application stores the last selected workspace ID in an HTTP-only, same-site cookie. This value is a navigation preference only. Server actions verify the authenticated user's membership and role before changing module configuration. Every future tenant-scoped server operation must repeat its own membership and permission checks; it must not trust this cookie as authorization.

The application uses the Supabase publishable/anon key through the SSR client. The service-role key is never needed in browser code or this workspace flow.

## Rules for future tables

Every business-owned table must:

1. Include a non-null `business_id uuid references public.businesses(id)`.
2. Enable RLS.
3. Use policies that verify membership for reads and the required role/permission for writes.
4. Have indexes for tenant-scoped access patterns.
5. Never trust a client-supplied business ID without checking the authenticated user's membership.

Do not use the Supabase service-role key in browser code. Server-side application services must still check membership and permissions; RLS is defense in depth.
