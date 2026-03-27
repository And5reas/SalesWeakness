import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { GetStagnantLeadsUseCase } from '../../../src/application/use-cases/GetStagnantLeadsUseCase.js';
import { InMemoryAuditLogRepository } from '../../../src/infrastructure/repositories/InMemoryAuditLogRepository.js';
import { AuditLog } from '../../../src/domain/entities/AuditLog.js';

describe('GetStagnantLeadsUseCase', () => {
  let auditRepo;
  let useCase;

  beforeEach(() => {
    auditRepo = new InMemoryAuditLogRepository();
    useCase = new GetStagnantLeadsUseCase({ auditLogRepository: auditRepo });
  });

  it('should return stagnation logs for the given company', async () => {
    await auditRepo.save(new AuditLog({ leadId: 'l1', stageId: 's1', companyId: 'c1', slaLimit: 2, elapsedTime: 5 }));
    await auditRepo.save(new AuditLog({ leadId: 'l2', stageId: 's1', companyId: 'c2', slaLimit: 2, elapsedTime: 3 }));

    const results = await useCase.execute('c1');

    assert.equal(results.length, 1);
    assert.equal(results[0].leadId, 'l1');
    assert.equal(results[0].companyId, 'c1');
  });

  it('should return an empty array when no stagnations exist for the company', async () => {
    const results = await useCase.execute('c-none');
    assert.deepEqual(results, []);
  });

  it('should return multiple logs when multiple stagnations exist', async () => {
    await auditRepo.save(new AuditLog({ leadId: 'l1', stageId: 's1', companyId: 'c1', slaLimit: 2, elapsedTime: 3 }));
    await auditRepo.save(new AuditLog({ leadId: 'l2', stageId: 's2', companyId: 'c1', slaLimit: 24, elapsedTime: 30 }));

    const results = await useCase.execute('c1');
    assert.equal(results.length, 2);
  });
});
