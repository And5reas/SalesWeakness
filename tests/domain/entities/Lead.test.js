import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Lead } from '../../../src/domain/entities/Lead.js';

describe('Lead entity', () => {
  describe('constructor', () => {
    it('should initialize all properties correctly', () => {
      const now = new Date();
      const lead = new Lead({ id: 'l1', currentStageId: 's1', companyId: 'c1', lastMovedAt: now });

      assert.equal(lead.id, 'l1');
      assert.equal(lead.currentStageId, 's1');
      assert.equal(lead.companyId, 'c1');
      assert.deepEqual(lead.lastMovedAt, now);
    });

    it('should convert lastMovedAt string to Date object', () => {
      const isoString = '2024-01-15T10:00:00.000Z';
      const lead = new Lead({ id: 'l1', currentStageId: 's1', companyId: 'c1', lastMovedAt: isoString });
      assert.ok(lead.lastMovedAt instanceof Date);
      assert.equal(lead.lastMovedAt.toISOString(), isoString);
    });
  });

  describe('isStagnated()', () => {
    it('should return true when elapsed time exceeds SLA limit', () => {
      const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
      const lead = new Lead({ id: 'l1', currentStageId: 's1', companyId: 'c1', lastMovedAt: threeHoursAgo });
      assert.equal(lead.isStagnated(2), true);
    });

    it('should return false when elapsed time is within SLA limit', () => {
      const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000);
      const lead = new Lead({ id: 'l1', currentStageId: 's1', companyId: 'c1', lastMovedAt: oneHourAgo });
      assert.equal(lead.isStagnated(2), false);
    });

    it('should return false when elapsed time exactly equals SLA limit', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const lead = new Lead({ id: 'l1', currentStageId: 's1', companyId: 'c1', lastMovedAt: twoHoursAgo });
      // diffHours > slaLimitHours, so exactly equal is NOT stagnated
      assert.equal(lead.isStagnated(2), false);
    });

    it('should return false when slaLimitHours is null', () => {
      const lead = new Lead({ id: 'l1', currentStageId: 's1', companyId: 'c1', lastMovedAt: new Date(0) });
      assert.equal(lead.isStagnated(null), false);
    });

    it('should return false when slaLimitHours is undefined', () => {
      const lead = new Lead({ id: 'l1', currentStageId: 's1', companyId: 'c1', lastMovedAt: new Date(0) });
      assert.equal(lead.isStagnated(undefined), false);
    });

    it('should accept a custom currentTime for deterministic testing', () => {
      const fixedNow = new Date('2024-06-01T12:00:00.000Z');
      const lastMoved = new Date('2024-06-01T09:00:00.000Z'); // 3 hours before fixedNow
      const lead = new Lead({ id: 'l1', currentStageId: 's1', companyId: 'c1', lastMovedAt: lastMoved });

      assert.equal(lead.isStagnated(2, fixedNow), true);
      assert.equal(lead.isStagnated(4, fixedNow), false);
    });

    it('should handle SLA of zero hours (any elapsed time stagnates)', () => {
      const oneSecondAgo = new Date(Date.now() - 1000);
      const lead = new Lead({ id: 'l1', currentStageId: 's1', companyId: 'c1', lastMovedAt: oneSecondAgo });
      assert.equal(lead.isStagnated(0), true);
    });
  });

  describe('getElapsedHours()', () => {
    it('should return approximate elapsed hours', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const lead = new Lead({ id: 'l1', currentStageId: 's1', companyId: 'c1', lastMovedAt: twoHoursAgo });
      const elapsed = lead.getElapsedHours();
      assert.ok(elapsed >= 2 && elapsed < 2.1, `Expected ~2 hours, got ${elapsed}`);
    });

    it('should accept a custom currentTime for deterministic testing', () => {
      const fixedNow = new Date('2024-06-01T12:00:00.000Z');
      const lastMoved = new Date('2024-06-01T06:00:00.000Z'); // 6 hours before
      const lead = new Lead({ id: 'l1', currentStageId: 's1', companyId: 'c1', lastMovedAt: lastMoved });
      assert.equal(lead.getElapsedHours(fixedNow), 6);
    });
  });
});
