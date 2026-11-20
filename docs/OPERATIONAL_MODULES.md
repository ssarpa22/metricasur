# Operational modules

All 15 first-party modules now use a shared operational record envelope in `business_records`.
Records are tenant-scoped and include title, description, lifecycle status, amount, quantity,
due date, category and reference. This provides a useful first CRUD workflow across sales,
inventory, purchasing, contacts, appointments, projects, time, proposals, services, waste,
costing, production, work orders and tasks.

## Security
- RLS checks business membership for reads and mutations.
- Inserts require the authenticated user as `created_by`.
- Create/update/delete additionally require the module to be enabled for that business.
- Server actions re-check the authenticated session, membership and enabled module before writing.
- No service-role key is used in the browser or server actions.

## Current scope
This is a practical shared record layer, not yet a full domain-specific ERP for each industry.
For example, stock valuation, appointment conflict detection, recipe ingredients, clinical records,
invoicing and payment processing need dedicated domain schemas and workflows. The generic amount
field is an operational note, not an accounting ledger. Do not use this first version for clinical
records or sensitive patient data.
