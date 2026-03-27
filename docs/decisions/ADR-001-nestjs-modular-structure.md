# ADR-001: NestJS and Modular Domain Structure

## Status
Accepted

## Context
The SalesWeakness MVP requires a backend foundation that can grow rapidly without accumulating massive technical debt, enforcing separation of concerns between CRM operations, analytics, and asynchronous automations.

## Decision
We chose **NestJS** as the backend framework due to its native TypeScript support, powerful dependency injection, and native modular structure. We adopted a module-per-domain pattern where every distinct business area (e.g., Auth, Tenants, Leads, Opportunities, Audit) is isolated in its own folder with its entity, service, controller, and module definitions.

## Consequences
- **Positive:** Clear boundaries between domains. Easy to extract specific modules into microservices later if scaling demands it (e.g., isolating the `Audit` domain). 
- **Negative:** Slightly more boilerplate per feature compared to a flatter Express/Fastify structure.

## Alternatives Considered
- *Express.js / Fastify (vanilla):* Rejected due to lack of enforced architectural patterns.
- *Go / Fiber:* Rejected to maintain language parity with the future frontend (TypeScript/React), lowering the cognitive load for full-stack developers on the team.
