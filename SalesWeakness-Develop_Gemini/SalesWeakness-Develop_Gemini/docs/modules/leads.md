# Leads Module (Step 01 Skeleton)

## Responsibilities
Manages prospective customers entering the top of the funnel.

## Current State
- `Lead` entity defined mapping to the architecture schema. 
- Critical fields tracked:
  - `tenantId` (for RLS).
  - `source` (for marketing analytics).
  - `isInactive` (for soft-delete logic — monitored by 180d worker).
  - `updatedAt` (monitored for in-activity threshold).
- Service and Controller stubs created.
- Unit tested (service instantiation with mock DB repository).

## Next Steps
- Implement `POST /v1/leads/ingest` for passive ingestion from webhooks, tracking `campaign_id` and checking for duplications within the same tenant.
