import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AuditLog } from '../../../src/domain/entities/AuditLog.js';

describe('AuditLog entity', () => {
  describe('constructor', () => {
    it('should initialize all required properties', () => {
      const before = new Date();
      const log = new AuditLog({
        leadId: 'l1',
        stageId: 's1',
        companyId: 'c1',
        slaLimit: 24,
        elapsedTime: 30,
      });
      const after = new Date();

      assert.ok(typeof log.id === 'string' && log.id.length > 0, 'id should be a non-empty string');
      assert.equal(log.eventType, 'WEAKNESS_STAGNATION');
      assert.equal(log.leadId, 'l1');
      assert.equal(log.stageId, 's1');
      assert.equal(log.companyId, 'c1');
      assert.equal(log.slaLimit, 24);
      assert.equal(log.elapsedTime, 30);
      assert.ok(log.detectedAt >= before && log.detectedAt <= after, 'detectedAt should be set to now');
    });

    it('should use a provided detectedAt value', () => {
      const fixedDate = new Date('2024-01-01T00:00:00.000Z');
      const log = new AuditLog({
        leadId: 'l1',
        stageId: 's1',
        companyId: 'c1',
        slaLimit: 2,
        elapsedTime: 5,
        detectedAt: fixedDate,
      });
      assert.deepEqual(log.detectedAt, fixedDate);
    });

    it('should generate a unique id for each instance', () => {
      const make = () => new AuditLog({ leadId: 'l1', stageId: 's1', companyId: 'c1', slaLimit: 1, elapsedTime: 2 });
      const log1 = make();
      const log2 = make();
      assert.notEqual(log1.id, log2.id);
    });
  });
});
