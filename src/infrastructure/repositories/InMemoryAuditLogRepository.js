export class InMemoryAuditLogRepository {
  constructor() {
    this.logs = [];
  }

  async save(auditLog) {
    this.logs.push(auditLog);
  }

  async findStagnationsByCompany(companyId) {
    return this.logs.filter(log => log.companyId === companyId && log.eventType === 'WEAKNESS_STAGNATION');
  }

  async hasRecentLogForLead(leadId, stageId) {
    // TODO: Simplified: check if an alert for this lead in this specific stage already exists
    return this.logs.some(log => 
      log.leadId === leadId && 
      log.stageId === stageId && 
      log.eventType === 'WEAKNESS_STAGNATION'
    );
  }

  // Returns transition logs filtered by company and optional date range.
  // In this in-memory prototype, no transition events are tracked, so this always returns [].
  async findTransitionsByCompany(companyId, startDate, endDate) {
    return this.logs.filter(log => {
      if (log.companyId !== companyId || log.eventType !== 'STAGE_TRANSITION') return false;
      const detectedAt = new Date(log.detectedAt);
      if (startDate && detectedAt < new Date(startDate)) return false;
      if (endDate && detectedAt > new Date(endDate)) return false;
      return true;
    });
  }
}
