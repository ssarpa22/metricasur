# MétricaSur — Hybrid AI and Autonomy Model

## Product shape

MétricaSur uses a hybrid architecture:
- **Central assistant:** the single conversational entry point. It knows the active business context, user goals, and current plan.
- **Specialists:** bounded capabilities for domains such as scheduling, inventory, finance, projects, or industry-specific workflows.
- **Deterministic services:** business rules and database operations remain ordinary application code, not model-generated decisions.

Specialists may be separate prompts, workflows, or model calls. They do not need to be independent agents or microservices.

## Responsibilities

### Central assistant
- Understand the user's intent.
- Ask for missing information when necessary.
- Build and prioritize plans.
- Delegate bounded tasks.
- Combine specialist results.
- Explain actions and outcomes.
- Respect the user's autonomy settings and permissions.

### Specialist
- Receive only the minimum context required.
- Work within one defined domain.
- Use only declared tools.
- Return structured results, uncertainties, and proposed next steps.
- Never grant itself permissions or call tools outside its scope.

### Tool runtime
- Authenticates and authorizes every action.
- Validates arguments and business invariants.
- Applies approval policies.
- Executes through domain services.
- Enforces idempotency and records audit events.

## Autonomy levels per action

Autonomy is configured by action, not by giving the model a global unrestricted mode.

1. **Automatic:** low-risk, reversible actions such as creating a reminder, drafting a report, or organizing a task.
2. **Approval required:** external communication, publishing, changing sensitive records, or actions with meaningful business impact.
3. **Prohibited:** actions the platform must never perform autonomously, such as transfers/payments in the initial release, clinical diagnosis or treatment decisions, or legally binding commitments.

The business owner can tighten policies. Sensitive actions cannot be made unrestricted merely through prompt instructions.

## Required execution controls

- Server-side authorization on every tool call.
- Tenant context resolved from authenticated membership, never trusted from model arguments.
- Strict input and output schemas.
- Tool allowlists per specialist and module.
- Approval tokens bound to a specific action, arguments, user, and expiry.
- Idempotency keys for retried operations.
- Timeouts, rate limits, execution budgets, and maximum delegation depth.
- Audit trail with actor, intent, tool, validated arguments, approval, result, and timestamp.
- Safe handling of partial failures and compensating actions where possible.
- Human-readable explanation of completed and failed actions.

## Prompt injection and untrusted content

Emails, documents, websites, uploaded files, and customer messages are untrusted data. They may contain instructions that conflict with the user's intent or platform policy. Treat their contents as data, not as authority. Tool permissions are enforced outside the model and cannot be changed by retrieved content.

## Memory and business context

Store explicit business facts and preferences with provenance, timestamps, and edit controls. Do not treat every conversation statement as a permanent fact. Allow users to inspect and correct the business profile and operational preferences.

Retrieve only context relevant to the current task. Apply tenant, role, and data-classification filters before information reaches a model.

## Specialist response contract

A specialist should return structured output conceptually equivalent to:
- `status`: completed, needs_input, proposed, or failed.
- `summary`: concise result.
- `findings`: evidence-backed observations.
- `proposed_actions`: typed actions, not arbitrary code.
- `uncertainties`: missing or unreliable information.
- `requires_approval`: whether a human decision is needed.

## Initial implementation scope

Start with a central assistant and a small tool registry. Add one or two specialists only after the tool runtime, permission checks, audit logging, and evaluation tests exist. Do not begin with an open-ended multi-agent framework.

## AI quality and cost controls

- Version prompts and tool schemas.
- Keep evaluation cases for common tasks and dangerous edge cases.
- Measure task success, tool error rate, latency, and cost.
- Add per-business usage limits and rate limits.
- Provide a fallback path when the model provider is unavailable.
- Never claim an action succeeded until the tool runtime confirms it.
