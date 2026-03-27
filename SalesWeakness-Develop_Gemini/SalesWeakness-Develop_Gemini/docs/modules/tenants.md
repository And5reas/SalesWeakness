# Tenants Module (Step 01 Skeleton)

## Responsibilities
Manages the root entities for SaaS customers (Tenants) and their global configurations (e.g. active plans, feature flags).

## Current State
- `Tenant` entity defined (`id`, `name`, `plan`, `createdAt`).
- Repository integrated via `TypeOrmModule.forFeature([Tenant])`.
- `TenantsService` and `TenantsController` stubs created.
- Unit tested (service instantiation).

## Next Steps
- Implement REST endpoints for tenant onboarding.
- Implement feature-flag validation logic.
