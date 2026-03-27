# Opportunities Module (Step 01 Skeleton)

## Responsibilities
Core transactional engine of the SalesWeakness CRM. Tracks deal progression through the pipeline stages.

## Current State
- `Opportunity` entity mapped to architecture schema.
- Key fields for the Active Diagnostics Engine:
  - `status`: Open | Won | Lost.
  - `updatedAt`: Reset on status/stage change. Scanned by the 48h stagnation worker.
  - `lostReason`: Mandatory field for `Lost` status (RF04).
  - `tenantId` (RLS enforced).
- Controller, service, module, and unit tests implemented as stubs.

## Next Steps
- Implement `PATCH /v1/deals/{id}/status` to update opportunity stages, enforcing `lost_reason` and publishing events.
- Implement the Kanban aggregate API for the SDR dashboard.
