import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { ScanStagnantLeadsUseCase } from '../../../src/application/use-cases/ScanStagnantLeadsUseCase.js';
import { InMemoryLeadRepository } from '../../../src/infrastructure/repositories/InMemoryLeadRepository.js';
import { InMemoryStageRepository } from '../../../src/infrastructure/repositories/InMemoryStageRepository.js';
import { InMemoryAuditLogRepository } from '../../../src/infrastructure/repositories/InMemoryAuditLogRepository.js';
import { Lead } from '../../../src/domain/entities/Lead.js';
import { Stage } from '../../../src/domain/entities/Stage.js';

const COMPANY_ID = 'company-test';

describe('ScanStagnantLeadsUseCase', () => {
  let leadRepo;
  let stageRepo;
  let auditRepo;
  let useCase;

  beforeEach(() => {
    leadRepo = new InMemoryLeadRepository();
    stageRepo = new InMemoryStageRepository();
    auditRepo = new InMemoryAuditLogRepository();
    useCase = new ScanStagnantLeadsUseCase({
      leadRepository: leadRepo,
      stageRepository: stageRepo,
      auditLogRepository: auditRepo,
    });
  });

  it('should detect and log a stagnant lead', async () => {
    await stageRepo.save(new Stage({ id: 's1', name: 'Triagem', companyId: COMPANY_ID, slaLimit: 2 }));
    await leadRepo.save(new Lead({
      id: 'l1',
      currentStageId: 's1',
      companyId: COMPANY_ID,
      lastMovedAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
    }));

    const result = await useCase.execute(COMPANY_ID);

    assert.equal(result.errors.length, 0);
    const logs = await auditRepo.findStagnationsByCompany(COMPANY_ID);
    assert.equal(logs.length, 1);
    assert.equal(logs[0].leadId, 'l1');
    assert.equal(logs[0].stageId, 's1');
    assert.equal(logs[0].companyId, COMPANY_ID);
    assert.equal(logs[0].slaLimit, 2);
    assert.ok(logs[0].elapsedTime > 2);
  });

  it('should not log a lead that has not exceeded the SLA', async () => {
    await stageRepo.save(new Stage({ id: 's1', name: 'Triagem', companyId: COMPANY_ID, slaLimit: 24 }));
    await leadRepo.save(new Lead({
      id: 'l1',
      currentStageId: 's1',
      companyId: COMPANY_ID,
      lastMovedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    }));

    await useCase.execute(COMPANY_ID);

    const logs = await auditRepo.findStagnationsByCompany(COMPANY_ID);
    assert.equal(logs.length, 0);
  });

  it('should enforce idempotency — not log twice for the same lead/stage', async () => {
    await stageRepo.save(new Stage({ id: 's1', name: 'Triagem', companyId: COMPANY_ID, slaLimit: 1 }));
    await leadRepo.save(new Lead({
      id: 'l1',
      currentStageId: 's1',
      companyId: COMPANY_ID,
      lastMovedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    }));

    await useCase.execute(COMPANY_ID);
    await useCase.execute(COMPANY_ID);

    const logs = await auditRepo.findStagnationsByCompany(COMPANY_ID);
    assert.equal(logs.length, 1);
  });

  it('should skip leads whose stage has no SLA configured', async () => {
    await stageRepo.save(new Stage({ id: 's1', name: 'Triagem', companyId: COMPANY_ID, slaLimit: null }));
    await leadRepo.save(new Lead({
      id: 'l1',
      currentStageId: 's1',
      companyId: COMPANY_ID,
      lastMovedAt: new Date(Date.now() - 100 * 60 * 60 * 1000),
    }));

    await useCase.execute(COMPANY_ID);

    const logs = await auditRepo.findStagnationsByCompany(COMPANY_ID);
    assert.equal(logs.length, 0);
  });

  it('should skip leads whose stage is not found in stageMap', async () => {
    // No stage saved — lead references a stage that doesn't exist
    await leadRepo.save(new Lead({
      id: 'l1',
      currentStageId: 's-missing',
      companyId: COMPANY_ID,
      lastMovedAt: new Date(Date.now() - 100 * 60 * 60 * 1000),
    }));

    const result = await useCase.execute(COMPANY_ID);

    assert.equal(result.errors.length, 0);
    const logs = await auditRepo.findStagnationsByCompany(COMPANY_ID);
    assert.equal(logs.length, 0);
  });

  it('should process multiple leads and log only the stagnant ones', async () => {
    await stageRepo.save(new Stage({ id: 's1', name: 'Triagem', companyId: COMPANY_ID, slaLimit: 2 }));
    // Stagnant
    await leadRepo.save(new Lead({ id: 'l1', currentStageId: 's1', companyId: COMPANY_ID, lastMovedAt: new Date(Date.now() - 5 * 60 * 60 * 1000) }));
    // Not stagnant
    await leadRepo.save(new Lead({ id: 'l2', currentStageId: 's1', companyId: COMPANY_ID, lastMovedAt: new Date(Date.now() - 1 * 60 * 60 * 1000) }));

    await useCase.execute(COMPANY_ID);

    const logs = await auditRepo.findStagnationsByCompany(COMPANY_ID);
    assert.equal(logs.length, 1);
    assert.equal(logs[0].leadId, 'l1');
  });

  it('should publish a lead.stagnated event via eventBus when available', async () => {
    await stageRepo.save(new Stage({ id: 's1', name: 'Triagem', companyId: COMPANY_ID, slaLimit: 1 }));
    await leadRepo.save(new Lead({ id: 'l1', currentStageId: 's1', companyId: COMPANY_ID, lastMovedAt: new Date(Date.now() - 5 * 60 * 60 * 1000) }));

    const publishedEvents = [];
    const mockEventBus = { publish: (event, payload) => publishedEvents.push({ event, payload }) };

    const useCaseWithBus = new ScanStagnantLeadsUseCase({
      leadRepository: leadRepo,
      stageRepository: stageRepo,
      auditLogRepository: auditRepo,
      eventBus: mockEventBus,
    });

    await useCaseWithBus.execute(COMPANY_ID);

    assert.equal(publishedEvents.length, 1);
    assert.equal(publishedEvents[0].event, 'lead.stagnated');
    assert.equal(publishedEvents[0].payload.leadId, 'l1');
    assert.equal(publishedEvents[0].payload.companyId, COMPANY_ID);
  });

  it('should return an error entry when processing a lead throws', async () => {
    await stageRepo.save(new Stage({ id: 's1', name: 'Triagem', companyId: COMPANY_ID, slaLimit: 1 }));
    await leadRepo.save(new Lead({ id: 'l1', currentStageId: 's1', companyId: COMPANY_ID, lastMovedAt: new Date(Date.now() - 5 * 60 * 60 * 1000) }));

    // Force auditRepo.save to throw
    auditRepo.save = async () => { throw new Error('DB error'); };
    // Ensure hasRecentLogForLead returns false so save is reached
    auditRepo.hasRecentLogForLead = async () => false;

    const result = await useCase.execute(COMPANY_ID);

    assert.equal(result.errors.length, 1);
    assert.equal(result.errors[0].leadId, 'l1');
    assert.equal(result.errors[0].error, 'DB error');
  });

  it('should respect the batchSize parameter', async () => {
    await stageRepo.save(new Stage({ id: 's1', name: 'Triagem', companyId: COMPANY_ID, slaLimit: 1 }));
    for (let i = 1; i <= 5; i++) {
      await leadRepo.save(new Lead({ id: `l${i}`, currentStageId: 's1', companyId: COMPANY_ID, lastMovedAt: new Date(Date.now() - 5 * 60 * 60 * 1000) }));
    }

    await useCase.execute(COMPANY_ID, 2); // batchSize of 2

    const logs = await auditRepo.findStagnationsByCompany(COMPANY_ID);
    assert.equal(logs.length, 2);
  });
});
