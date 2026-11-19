# MétricaSur

MétricaSur is an adaptive business-management platform for entrepreneurs, independent professionals, and small businesses. It combines a universal operational core, industry-specific modules, and a hybrid AI system: one central assistant coordinating bounded domain specialists.

## Product direction

- Hybrid onboarding that discovers a business and recommends a configurable workspace.
- A modular monolith with a universal core and versioned industry modules.
- Hybrid AI orchestration with explicit permissions, approvals, and auditability.
- Progressive complexity: useful for a solo freelancer and extensible for a growing business.

## Architecture documentation

- [Product vision](docs/PRODUCT_VISION.md)
- [Technical architecture](docs/ARCHITECTURE.md)
- [Module system](docs/MODULE_SYSTEM.md)
- [AI autonomy and safety](docs/AI_AUTONOMY.md)
- [Development roadmap](docs/ROADMAP.md)

## Project status

Architecture and product foundation are being defined. The application implementation has not started yet.

## Development principles

- Core workflows must work without AI.
- Every business-owned record is tenant-scoped.
- AI actions go through validated, permission-checked application tools.
- Industry rules must be validated and must not be invented by AI.
- New capabilities should be added through modules rather than business-type conditionals.
