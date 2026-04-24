import { Lead } from '../../domain/entities/Lead.js';
import crypto from 'crypto';

export class IngestLeadUseCase {
  constructor({ leadRepository }) {
    this.leadRepository = leadRepository;
  }

  async execute(tenantId, leadData) {
    // Validação de deduplicação (409 Conflict)
    const existingLead = await this.leadRepository.findByEmailAndTenant(leadData.email, tenantId);
    
    if (existingLead) {
      const error = new Error('Conflict');
      error.statusCode = 409;
      error.leadId = existingLead.id;
      throw error;
    }

    // Criação com rastreabilidade (source e campaign_id)
    const newLead = new Lead({
      id: crypto.randomUUID(), 
      companyId: tenantId, 
      email: leadData.email,
      firstName: leadData.first_name,
      lastName: leadData.last_name,
      source: leadData.source,
      campaignId: leadData.campaign_id,
      currentStageId: 'stage-1', // Todo novo lead entra na primeira etapa
      lastMovedAt: new Date()
    });

    await this.leadRepository.save(newLead);
    return newLead;
  }
}