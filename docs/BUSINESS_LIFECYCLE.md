# Business workspace lifecycle

## Deleting an accidental workspace

A workspace can be permanently deleted by its owner from the workspace page. The UI asks for explicit confirmation before submitting the request.

The application calls the `delete_business(uuid)` database function. The function runs with a fixed empty `search_path`, checks the authenticated user's owner membership, and rejects admins and regular members. The database remains the final authorization boundary; hiding the button is not treated as security.

Deleting a workspace cascades to its memberships and installed module configuration. Future business-owned tables must define an intentional foreign-key deletion policy and must be covered by deletion tests before being introduced. This action is permanent and should be paired with export/retention workflows before production launch.

## Local validation

Apply the migration without resetting local data, then run:

```powershell
npx supabase migration up --local
npx supabase test db
npm run check
npm run build
```
