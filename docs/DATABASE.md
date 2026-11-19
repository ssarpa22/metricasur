# Database foundation

## Scope
The initial migrations establish the tenant boundary and controlled industry classification for MétricaSur:

- `businesses` is the workspace/tenant root.
- `businesses.industry` stores a controlled industry slug, never arbitrary free text.
- `business_memberships` maps Supabase Auth users to businesses and their workspace role.
- A user can belong to multiple businesses; each business can have multiple users.
- Membership roles are initially `owner`, `admin`, and `member`.
- Row Level Security (RLS) is enabled on both tables.
- The `create_business(name, industry)` RPC validates the industry and creates the business and owner membership atomically.

## Apply locally
Requirements: Docker Desktop and the Supabase CLI.

1. Copy `.env.example` to `.env.local` for the Next.js app (database credentials are not needed for this migration).
2. Start the local Supabase stack:

   ```powershell
   npx supabase start
   ```

3. Apply migrations:

   ```powershell
   npx supabase db reset
   ```

4. Inspect the local database:

   ```powershell
   npx supabase status
   ```

The first `npx` invocation may ask permission to download the Supabase CLI. Review and accept only if you want to run the local database.

For a linked hosted project, link it explicitly and review pending migrations before applying:

```powershell
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase migration list
npx supabase db push --dry-run
npx supabase db push
```

Do not commit project credentials or database passwords.

## Test authorization, tenant isolation, and industry validation
With the local Supabase stack running and migrations applied, run:

```powershell
npx supabase test db
```

The pgTAP suite checks anonymous access, atomic business creation, tenant isolation, membership visibility, role permissions, and rejection of industry values outside the allowlist. Test fixtures are rolled back and do not persist.

## Authorization model

| Operation | Initial policy |
| --- | --- |
| Read a business | Any active member |
| Update business details | Owner or admin |
| Read own membership | The member |
| Read all memberships in a workspace | Owner or admin |
| Create a business | Authenticated user through `create_business(name, industry)` |
| Add/remove members or change roles | Not exposed to clients yet |
| Delete a business | Not exposed |

The membership helper functions use `SECURITY DEFINER` with an empty `search_path` and fully qualified table names to avoid recursive RLS evaluation and search-path attacks.

## Application workspace context
The Next.js application stores the last selected workspace ID in an HTTP-only, same-site cookie. This value is a navigation preference only. Server actions verify the authenticated user and query `business_memberships` before accepting a workspace switch. Every future tenant-scoped server operation must repeat its own membership and permission checks; it must not trust this cookie as authorization.

The application uses the Supabase publishable/anon key through the SSR client. The service-role key is never needed in browser code or this workspace flow.

## Controlled industry catalog
The application owns the canonical industry allowlist in `src/lib/industries.ts`. The form uses those options, the server action validates the submitted slug with Zod, and the database independently enforces the same set with a CHECK constraint and the creation RPC. A modified browser request cannot introduce an arbitrary industry string.

Existing workspaces are migrated to `other` so the schema change is backward-compatible. Industry identifiers are stable slugs; display labels and descriptions can evolve without changing stored records.

## Rules for future tables
Every business-owned table must:

1. Include a non-null `business_id uuid references public.businesses(id)`.
2. Enable RLS.
3. Use policies that verify membership for reads and the required role/permission for writes.
4. Have indexes for tenant-scoped access patterns.
5. Never trust a client-supplied business ID without checking the authenticated user's membership.

Do not use the Supabase service-role key in browser code. Server-side application services must still check membership and permissions; RLS is defense in depth.

## Deliberate limitations
This increment adds account sign-up/sign-in, profile display-name editing, business creation, workspace selection, and the first industry-aware workspace shell. The industry selection changes the workspace's priorities and initial guidance. Full operational workflows, specialized modules, invitations, and member management will be implemented in later increments.
