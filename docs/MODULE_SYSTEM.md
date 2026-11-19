# MétricaSur — Module System

## Purpose

Modules add industry-specific workflows without turning the universal core into a collection of industry conditionals.

A module is a versioned, first-party package of domain capabilities, UI, permissions, events, and configuration. In the initial release, modules are shipped with the application and enabled per business. They are not arbitrary code uploaded by customers.

## Current implementation

The platform-owned catalog lives in `src/lib/modules.ts` and validates module identifiers with Zod. Each definition includes a stable slug, display name, description, category, and compatible industries.

The `business_modules` table stores installations per workspace:
- Every row belongs to exactly one `business_id`.
- Module slugs are constrained by a database allowlist.
- New workspaces receive a starter set based on their industry.
- Existing workspaces are backfilled with the starter set for their current industry.
- Owners and admins can enable or disable modules; members can read the configuration.
- Disabling changes only the `enabled` flag. It never deletes module data.
- RLS enforces tenant isolation independently of the server actions.

The current increment establishes module discovery and lifecycle configuration. It does not yet implement the operational records inside each module.

## Starter module recommendations

| Industry | Starter modules |
| --- | --- |
| Retail | Sales, inventory, purchasing, suppliers, customers, tasks |
| Food service | Sales, inventory, purchasing, suppliers, waste tracking, menu costing, tasks |
| Butcher | Sales, inventory, purchasing, suppliers, waste tracking, tasks |
| Greengrocer | Sales, inventory, purchasing, suppliers, waste tracking, tasks |
| Beauty | Appointments, services, customers, inventory, tasks |
| Healthcare | Appointments, services, customers, tasks |
| Professional services | Customers, projects, proposals, services, tasks |
| Freelancer | Customers, projects, time tracking, proposals, tasks |
| Construction | Projects, work orders, purchasing, suppliers, tasks |
| Manufacturing | Production, inventory, purchasing, suppliers, work orders, tasks |
| Other | Customers, tasks |

These are conservative starting points, not hard restrictions. Owners and admins can enable additional compatible modules from the catalog.

## Module lifecycle

1. **Discover:** show compatible modules in the catalog.
2. **Recommend:** onboarding suggests modules based on business activity and goals.
3. **Install:** create a business-module installation record and default configuration.
4. **Configure:** collect the settings required by the module.
5. **Use:** expose its routes, entities, tools, and workflows.
6. **Update:** migrate configuration/data using explicit versioned migrations.
7. **Disable:** hide module functionality without deleting its data.
8. **Uninstall:** only where safe, with explicit data-retention and export rules.

## Manifest concept

A module manifest is validated against a platform-owned schema. Illustrative example:

```ts
type ModuleManifest = {
  slug: string;
  version: string;
  name: string;
  description: string;
  category: string;
  platformApiVersion: string;
  navigation: Array<{ label: string; route: string; icon?: string }>;
  permissions: Array<{ key: string; description: string }>;
  tools: Array<{
    name: string;
    description: string;
    inputSchema: unknown;
    requiredPermissions: string[];
    approval: "automatic" | "required" | "prohibited";
  }>;
  events: Array<{ name: string; description: string }>;
  configurationSchema: unknown;
};
```

The actual runtime contract must use validated schemas, not trust arbitrary `unknown` input.

## Data ownership

- Core owns shared entities such as businesses, memberships, customers, tasks, and documents.
- A module owns its industry-specific entities.
- Modules may reference core entities through stable IDs and application services.
- Modules must not query another module's private tables directly.
- All module-owned business records include `business_id`.
- JSONB is for flexible configuration/metadata; high-value operational entities should be relational.

## Example module boundaries

### Freelancer
Projects, deliverables, time entries, proposals, contracts, client follow-ups, and project profitability.

### Butcher shop
Meat products and cuts, lots/batches, stock movements, waste, supplier purchases, and recorded storage conditions. Safety limits must come from validated jurisdiction-specific sources and be maintained as rules, not improvised by AI.

### Dentistry
Patients, appointments, treatment plans, clinical records, and documents. Clinical data requires stricter access controls, auditability, retention policies, and jurisdiction-specific privacy review. AI must not make diagnoses or treatment decisions.

### Hair and beauty
Services, professionals, appointments, resources, packages, and product usage.

## Module quality checklist

- Manifest schema validates.
- Permissions are least-privilege.
- RLS and service-layer checks enforce tenant scope.
- Migrations are reversible where practical and safe.
- Disabling a module preserves data.
- AI tools have strict input/output schemas and approval policies.
- Domain rules have automated tests.
- Sensitive data is classified and protected.
- Module is compatible with the declared platform API version.
