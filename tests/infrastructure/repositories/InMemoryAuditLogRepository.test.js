import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryAuditLogRepository } from '../../../src/infrastructure/repositories/InMemoryAuditLogRepository.js';
import { AuditLog } from '../../../src/domain/entities/AuditLog.js';

describe('InMemoryAuditLogRepository', () => {
  let repo;

  beforeEach(() => {
    repo = new InMemoryAuditLogRepository();
  });

  describe('save()', () => {
    it('should persist an audit log', async () => {
      const log = new AuditLog({ leadId: 'l1', stageId: 's1', companyId: 'c1', slaLimit: 2, elapsedTime: 3 });
      await repo.save(log);
      const results = await repo.findStagnationsByCompany('c1');
      assert.equal(results.length, 1);
      assert.equal(results[0].leadId, 'l1');
    });
  });

  describe('findStagnationsByCompany()', () => {
    it('should return only logs for the given company', async () => {
      await repo.save(new AuditLog({ leadId: 'l1', stageId: 's1', companyId: 'c1', slaLimit: 2, elapsedTime: 3 }));
      await repo.save(new AuditLog({ leadId: 'l2', stageId: 's1', companyId: 'c2', slaLimit: 2, elapsedTime: 3 }));

      const results = await repo.findStagnationsByCompany('c1');
      assert.equal(results.length, 1);
      assert.equal(results[0].companyId, 'c1');
    });

    it('should return an empty array when no logs exist for the company', async () => {
      const results = await repo.findStagnationsByCompany('c-unknown');
      assert.deepEqual(results, []);
    });

    it('should only return WEAKNESS_STAGNATION events', async () => {
      const log = new AuditLog({ leadId: 'l1', stageId: 's1', companyId: 'c1', slaLimit: 2, elapsedTime: 3 });
      // Simulate a different event type stored directly
      const otherLog = { ...log, id: 'other-id', eventType: 'OTHER_EVENT', companyId: 'c1' };
      repo.logs.push(otherLog);
      await repo.save(log);

      const results = await repo.findStagnationsByCompany('c1');
      assert.equal(results.length, 1);
      assert.equal(results[0].eventType, 'WEAKNESS_STAGNATION');
    });
  });

  describe('hasRecentLogForLead()', () => {
    it('should return true when a stagnation log already exists for the lead and stage', async () => {
      await repo.save(new AuditLog({ leadId: 'l1', stageId: 's1', companyId: 'c1', slaLimit: 2, elapsedTime: 3 }));
      const result = await repo.hasRecentLogForLead('l1', 's1');
      assert.equal(result, true);
    });

    it('should return false when no log exists for the lead', async () => {
      const result = await repo.hasRecentLogForLead('l-none', 's1');
      assert.equal(result, false);
    });

    it('should return false when log exists for lead but different stage', async () => {
      await repo.save(new AuditLog({ leadId: 'l1', stageId: 's1', companyId: 'c1', slaLimit: 2, elapsedTime: 3 }));
      const result = await repo.hasRecentLogForLead('l1', 's2');
      assert.equal(result, false);
    });
  });

  describe('findTransitionsByCompany()', () => {
    it('should return an empty array when no transition logs exist', async () => {
      // Only stagnation logs are seeded; no STAGE_TRANSITION events
      await repo.save(new AuditLog({ leadId: 'l1', stageId: 's1', companyId: 'c1', slaLimit: 2, elapsedTime: 3 }));
      const results = await repo.findTransitionsByCompany('c1', null, null);
      assert.deepEqual(results, []);
    });

    it('should filter by companyId', async () => {
      const transition = {
        id: 't1',
        eventType: 'STAGE_TRANSITION',
        companyId: 'c1',
        detectedAt: new Date(),
        fromStage: 'Triagem',
        toStage: 'Qualificação',
      };
      repo.logs.push(transition);

      const resultsC1 = await repo.findTransitionsByCompany('c1', null, null);
      assert.equal(resultsC1.length, 1);

      const resultsC2 = await repo.findTransitionsByCompany('c2', null, null);
      assert.equal(resultsC2.length, 0);
    });

    it('should filter by startDate', async () => {
      const transition = {
        id: 't1',
        eventType: 'STAGE_TRANSITION',
        companyId: 'c1',
        detectedAt: new Date('2024-01-10T00:00:00.000Z'),
        fromStage: 'Triagem',
        toStage: 'Qualificação',
      };
      repo.logs.push(transition);

      const after = await repo.findTransitionsByCompany('c1', '2024-01-05', null);
      assert.equal(after.length, 1);

      const notIncluded = await repo.findTransitionsByCompany('c1', '2024-01-15', null);
      assert.equal(notIncluded.length, 0);
    });

    it('should filter by endDate', async () => {
      const transition = {
        id: 't1',
        eventType: 'STAGE_TRANSITION',
        companyId: 'c1',
        detectedAt: new Date('2024-01-10T00:00:00.000Z'),
        fromStage: 'Triagem',
        toStage: 'Qualificação',
      };
      repo.logs.push(transition);

      const within = await repo.findTransitionsByCompany('c1', null, '2024-01-15');
      assert.equal(within.length, 1);

      const excluded = await repo.findTransitionsByCompany('c1', null, '2024-01-05');
      assert.equal(excluded.length, 0);
    });
  });
});
