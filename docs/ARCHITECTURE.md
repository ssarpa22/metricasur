# MétricaSur — Technical Architecture

## Status

Proposed baseline. This document records the initial direction before implementation. Technology choices can be revised through Architecture Decision Records (ADRs).

## Architectural style

Start with a **modular monolith**: one deployable application with explicit domain boundaries. Avoid microservices until measured scale, independent deployment needs, or team boundaries justify them.

The universal core owns shared concepts. Industry modules extend the platform through registered capabilities, domain services, events, and UI routes. Modules must not reach into another module's internal tables or services.

## Proposed technology baseline

- **Application:** Next.js App Router + TypeScript.
- **UI:** Tailwind CSS and accessible reusable components.
- **Database:** PostgreSQL.
- **Auth and file storage:** Supabase Auth and Supabase Storage.
- **Authorization:** server-side permission checks plus PostgreSQL Row Level Security (RLS).
- **Validation:** schema validation at every API/tool boundary (Zod is the initial candidate).
- **Background work:** a queue/worker abstraction backed initially by PostgreSQL and a transactional outbox. Select a managed queue when workload requires it.
- **AI:** provider-neutral model adapter; tool execution remains in MétricaSur's backend.
- **Testing:** unit tests for domain logic, integration tests for database policies and services, and end-to-end tests for critical journeys.

Do not expose service-role credentials or model-provider secrets to the browser.

## High-level layers

1. **Presentation:** pages, components, forms, client state.
2. **Application:** use cases, orchestration, input/output schemas.
3. **Domain:** business rules, entities, policies, domain events.
4. **Infrastructure:** PostgreSQL repositories, Supabase adapters, storage, queues, model providers, external integrations.

The dependency direction points inward: domain code must not depend on Next.js, Supabase, or a specific AI vendor.

## Suggested repository layout

```text
src/
  app/                  # routes and layouts
  components/           # shared UI
  core/
    auth/
    businesses/
    memberships/
    permissions/
    customers/
    tasks/
    calendar/
    finance/
    inventory/
    documents/
    notifications/
  modules/
    registry/
    contracts/
    installed/
  ai/
    orchestrator/
    specialists/
    tools/
    policies/
    providers/
  automation/
    events/
    rules/
    jobs/
  infrastructure/
    database/
    storage/
    queue/
    integrations/
  lib/
supabase/
  migrations/
  seed.sql
tests/
  unit/
  integration/
  e2e/
docs/
```

This is a target structure, not a requirement to create empty directories before they are needed.

## Multi-tenancy and data ownership

- A user may belong to multiple businesses.
- A business may have multiple members, each with a role and scoped permissions.
- Every business-owned row must include a non-null `business_id`.
- Requests must resolve an active business membership on the server.
- RLS policies must enforce tenant boundaries as defense in depth.
- Never trust a client-supplied `business_id` without verifying membership and permission.
- Background jobs and AI tool calls must carry an explicit tenant context.
- Cross-business administration must use a separate, tightly controlled path.

## Initial domain model

Core tables (names are provisional):
- `users` / Supabase Auth identity.
- `businesses`.
- `business_memberships`.
- `roles` and permission assignments, or a constrained role/permission model.
- `module_definitions`.
- `business_modules`.
- `customers`, `suppliers`, `tasks`, `calendar_events`.
- `products`, `inventory_movements`.
- `financial_entries`.
- `documents`, `notifications`.
- `domain_events` / `outbox_events`.
- `ai_runs`, `ai_tool_calls`, `audit_logs`.

Use relational tables for operational records and relationships. Use JSONB for module configuration, flexible metadata, and versioned manifests—not as a replacement for all relational data.

## Module boundaries

A module integrates through a versioned manifest and registered server capabilities. The registry validates:
- Unique module slug and version.
- Required platform API version.
- Declared entities and migrations.
- Routes and navigation metadata.
- Tool/action schemas.
- Permissions required by each action.
- Event subscriptions and automation definitions.

Module code is trusted application code shipped with the platform. Do not support arbitrary third-party executable plugins or uploaded code in the initial architecture.

## AI execution path

1. Authenticate the user and resolve active business membership.
2. Build a minimal, permission-filtered context for that business.
3. Ask the central orchestrator to interpret the request and create a plan.
4. Select tools or delegate to a specialist with bounded input.
5. Validate tool arguments and check authorization on the server.
6. Apply approval policy before sensitive operations.
7. Execute with idempotency where appropriate.
8. Persist tool calls, results, and audit events.
9. Verify the outcome and report it to the user.

The model never receives direct database credentials and cannot bypass application services.

## Events and background work

Use domain events to decouple workflows. Persist events in the same database transaction as the business change (transactional outbox). Workers process them with retries, idempotency keys, bounded concurrency, and dead-letter handling.

## Observability

Capture structured logs, request IDs, tenant IDs (non-sensitive identifiers), job IDs, AI run IDs, tool names, latency, token/cost metadata, and failures. Never log secrets or unnecessary sensitive personal data.

## Quality gates

- Type checking and linting.
- Unit tests for domain rules.
- Integration tests for authorization and RLS.
- End-to-end tests for registration, business creation, switching business, and core CRUD.
- Migration checks and seed validation.
- Dependency and secret scanning before production.
