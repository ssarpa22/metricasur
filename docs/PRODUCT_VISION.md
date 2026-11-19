# MétricaSur — Product Vision

## Vision

MétricaSur is an adaptive operating platform for entrepreneurs, independent professionals, and small businesses. It combines a universal business-management core with industry-specific modules and an AI system that can coordinate work and execute authorized actions.

The product should make business operations easier, not force every business to adopt the same workflow.

## Product principles

1. **Useful before intelligent.** Core workflows must work without AI.
2. **Adapt to the business.** Onboarding identifies the business context and proposes a relevant workspace.
3. **One coherent experience.** A central assistant coordinates specialized capabilities.
4. **Autonomy with boundaries.** The AI may act independently only within explicit, revocable permissions.
5. **Explainable operations.** Users can inspect what the AI did, why, and with what result.
6. **Progressive complexity.** Simple businesses see a simple workspace; advanced capabilities appear when needed.
7. **Industry correctness.** Regulated or safety-sensitive workflows require validated rules and human oversight.

## Audience

The platform targets a broad spectrum:
- Independent workers and freelancers.
- Microbusinesses and local shops.
- Service providers and practices.
- Small businesses with teams, multiple locations, or more complex operations.

The initial experience must remain approachable for a first-time software user while supporting richer workflows as a business grows.

## Onboarding: hybrid

Onboarding combines guided discovery with a configurable module catalog.

1. Ask a small number of questions: business name, activity, size, goals, and current pain points.
2. Infer a proposed workspace and explain why each tool is recommended.
3. Let the user accept, remove, or defer suggested modules.
4. Create the business workspace and seed only essential configuration.
5. Allow later changes from a module catalog and settings.

The system must not assume that one industry label fully describes a business. A business may combine activities and install multiple modules.

## AI architecture: hybrid

A central business assistant owns the conversation, shared context, and task coordination. It can delegate bounded work to specialized agents or domain services, such as scheduling, inventory, finance, or a specific industry module.

Specialists do not receive unrestricted database access. They operate through typed tools and scoped permissions. The central assistant remains responsible for presenting a coherent plan and outcome.

## Initial product scope

The first release focuses on:
- Accounts, businesses, memberships, and roles.
- A simple home dashboard.
- Customers and suppliers.
- Tasks and calendar items.
- Basic products and inventory.
- Income and expense records.
- Documents and notifications.
- A module catalog and installation model.
- AI assistant foundations, initially with limited and auditable tools.

## Non-goals for the first release

- Supporting every industry with deep workflows on day one.
- Replacing regulated professional judgment.
- Unsupervised payments, transfers, clinical decisions, or legally binding actions.
- Microservices before operational needs justify them.
- Training a proprietary foundation model.

## Success criteria

- A new user can create a business and reach a useful workspace without technical help.
- A business can enable or disable modules without losing unrelated data.
- Every business-owned record is isolated from other businesses.
- AI actions are permission-checked, auditable, and recoverable.
- New industry modules can be added without rewriting the universal core.
