# ADR-002: Multi-tenancy Isolation via PostgreSQL RLS

## Status
Accepted

## Context
SalesWeakness is a multi-tenant SaaS application (UC01). The absolute highest priority is ensuring zero data leakage between tenants. Implementing `WHERE tenant_id = ?` clauses manually in every single repository query is error-prone and a single forgotten clause could cause a massive data breach.

## Decision
We enforce multi-tenancy at the database level using **PostgreSQL Row Level Security (RLS)**. 
1. The `TenantContextInterceptor` intercepts authenticated requests, extracts the `tenant_id` from the JWT payload.
2. The `tenant_id` is injected into the database connection context via `SET LOCAL app.current_tenant_id = ?` before any queries run.
3. Every table in the system has a `tenant_id` column and an RLS policy (`USING (tenant_id = current_setting('app.current_tenant_id')::INTEGER)`).

## Consequences
- **Positive:** Mathematical guarantee that cross-tenant queries are impossible at the database level, regardless of application logic bugs.
- **Positive:** Super simple application queries: `Repository<Lead>.find()` automatically only returns leads for the current tenant.
- **Negative:** Connection pooling behavior requires careful lifecycle management to ensure `SET LOCAL` is cleared or overwritten per transaction/claim.

## Alternatives Considered
- *Database-per-tenant:* Rejected due to severe operational complexity and cost overhead for thousands of small tenants.
- *Schema-per-tenant:* Rejected because TypeORM connection switching per schema adds significant latency and caching issues.
