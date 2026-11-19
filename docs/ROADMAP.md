# MétricaSur — Development Roadmap

This roadmap is outcome-based. Each phase should deliver a working increment with tests and a reviewable pull request.

## Phase 0 — Product and architecture foundation
- [x] Define target audience: all entrepreneurs and small businesses.
- [x] Define hybrid onboarding.
- [x] Define hybrid central-assistant/specialist AI architecture.
- [x] Choose modular monolith as the starting architecture.
- [ ] Approve architecture and initial technology baseline.
- [ ] Define first release acceptance criteria.

## Phase 1 — Application foundation
**Outcome:** a user can register, create a business, and enter a tenant-isolated workspace.

- Initialize Next.js + TypeScript application.
- Configure formatting, linting, type checking, and tests.
- Configure Supabase project integration and environment validation.
- Add initial SQL migrations.
- Implement business and membership model.
- Add RLS policies and integration tests.
- Implement registration, login, business creation, and business switching.
- Add minimal responsive application shell.

## Phase 2 — Universal core
**Outcome:** a small business can manage essential daily operations.

- Customers and suppliers.
- Tasks and calendar.
- Basic products and stock movements.
- Income and expense records.
- Documents and notifications.
- Dashboard with useful summaries.
- Search, filters, and activity history.

## Phase 3 — Module platform
**Outcome:** businesses can activate relevant capabilities without changing the core.

- Module manifest schema and registry.
- Module catalog and installation records.
- Configuration and versioning.
- Module navigation and permission declarations.
- First general-purpose modules.
- Module lifecycle and data-retention behavior.

## Phase 4 — AI foundation
**Outcome:** the assistant can answer questions from authorized business data and execute safe, auditable actions.

- Provider adapter.
- Central assistant orchestration.
- Context retrieval with tenant/permission filters.
- Typed tool registry.
- Read-only tools first.
- Auditing, usage budgets, and evaluations.
- Approval workflow for sensitive actions.

## Phase 5 — Automation and specialists
**Outcome:** MétricaSur can proactively monitor workflows and coordinate bounded specialists.

- Transactional outbox and worker.
- Event subscriptions and scheduled jobs.
- Rule engine and retries.
- First domain specialists.
- Autonomous low-risk actions.
- Notifications, monitoring, and recovery.

## Phase 6 — Industry depth and growth
**Outcome:** add valuable sector workflows and prepare for commercial scale.

- Build modules based on user validation and demand.
- Integrations with external systems.
- Billing and subscription plans.
- Organization-level administration.
- Performance, observability, backups, and disaster recovery.
- Security and privacy review for regulated sectors.

## Pull request sequence

1. **PR #1 — Architecture foundation:** product vision, technical architecture, module contract, AI autonomy model, roadmap.
2. **PR #2 — App scaffold:** initialize the chosen application stack and developer quality gates.
3. **PR #3 — Database foundation:** migrations, tenant model, RLS, and integration tests.
4. **PR #4 — Authentication and workspace:** sign-in, business creation, membership, and business switching.
5. **PR #5 — Application shell:** navigation, responsive layout, dashboard placeholder, and empty states.
6. **PR #6 — First core workflow:** customers and tasks, end-to-end.
7. **PR #7 — Module registry:** manifest validation and business module installation.
8. **PR #8 — AI tool runtime:** typed tools, permission checks, audit trail, and read-only assistant.

Do not start AI autonomy before authorization, audit logging, and deterministic domain services are in place.
