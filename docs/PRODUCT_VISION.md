# MétricaSur — Product Vision

## Who it serves

MétricaSur is for entrepreneurs, freelancers, independent professionals, and small businesses across industries. It should be approachable for people without formal administrative or technical training.

## Product promise

A business operating system that adapts to the way each business works—not another generic accounting dashboard or chatbot. The universal core provides identity, workspaces, people, tasks, calendar, finances, and shared workflows. Industry modules add the domain-specific capabilities each business needs.

## Experience principles

- Start with the user's real workflow and vocabulary.
- Keep the interface calm, clear, and useful on small screens.
- Show only the capabilities that matter to the current business.
- Make automation explainable, permissioned, and reversible where possible.
- Keep business data separated and make workspace context visible.
- Never make AI or automation a prerequisite for basic product use.

## Initial audience and rollout

The first release targets a broad set of small businesses with a universal core and a small number of focused industry modules. Onboarding combines a guided interview with a configurable module catalog.

## Multi-business accounts

A user may own or collaborate in multiple business workspaces. The active workspace is an explicit navigation preference, not an authorization boundary: every server-side operation must independently verify the authenticated user's membership, and database RLS remains enabled as defense in depth.
