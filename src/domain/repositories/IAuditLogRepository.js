export class IAuditLogRepository {
  async save(auditLog) { throw new Error('Not implemented'); }
  
  // Find all WEAKNESS_STAGNATION alerts for a company
  async findStagnationsByCompany(companyId) { throw new Error('Not implemented'); }

  // Useful to enforce idempotency
  async hasRecentLogForLead(leadId, stageId) { throw new Error('Not implemented'); }

  // Find stage transition logs for a company within a date range (used for conversion latency calculation)
  async findTransitionsByCompany(companyId, startDate, endDate) { throw new Error('Not implemented'); }
}
