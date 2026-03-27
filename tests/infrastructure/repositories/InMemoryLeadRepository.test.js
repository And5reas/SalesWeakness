import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryLeadRepository } from '../../../src/infrastructure/repositories/InMemoryLeadRepository.js';
import { Lead } from '../../../src/domain/entities/Lead.js';

const makeLeadData = (overrides = {}) => ({
  id: 'l1',
  currentStageId: 's1',
  companyId: 'c1',
  lastMovedAt: new Date(),
  ...overrides,
});

describe('InMemoryLeadRepository', () => {
  let repo;

  beforeEach(() => {
    repo = new InMemoryLeadRepository();
  });

  describe('save()', () => {
    it('should persist a new lead', async () => {
      const lead = new Lead(makeLeadData());
      await repo.save(lead);
      const found = await repo.findById('l1');
      assert.ok(found);
      assert.equal(found.id, 'l1');
    });

    it('should update an existing lead with the same id', async () => {
      const lead = new Lead(makeLeadData({ currentStageId: 's1' }));
      await repo.save(lead);

      const updated = new Lead(makeLeadData({ currentStageId: 's2' }));
      await repo.save(updated);

      const result = await repo.findById('l1');
      assert.equal(result.currentStageId, 's2');

      const all = await repo.findAllByCompany('c1');
      assert.equal(all.length, 1);
    });
  });

  describe('findById()', () => {
    it('should return a Lead instance for an existing id', async () => {
      await repo.save(new Lead(makeLeadData()));
      const result = await repo.findById('l1');
      assert.ok(result instanceof Lead);
    });

    it('should return null for a non-existing id', async () => {
      const result = await repo.findById('unknown');
      assert.equal(result, null);
    });
  });

  describe('findAllByCompany()', () => {
    it('should return all leads for a given company', async () => {
      await repo.save(new Lead(makeLeadData({ id: 'l1', companyId: 'c1' })));
      await repo.save(new Lead(makeLeadData({ id: 'l2', companyId: 'c1' })));
      await repo.save(new Lead(makeLeadData({ id: 'l3', companyId: 'c2' })));

      const results = await repo.findAllByCompany('c1');
      assert.equal(results.length, 2);
      results.forEach(l => assert.equal(l.companyId, 'c1'));
    });

    it('should return an empty array when no leads exist for the company', async () => {
      const results = await repo.findAllByCompany('c-unknown');
      assert.deepEqual(results, []);
    });
  });

  describe('getStagnantCandidates()', () => {
    it('should return leads limited to batchSize', async () => {
      for (let i = 1; i <= 5; i++) {
        await repo.save(new Lead(makeLeadData({ id: `l${i}` })));
      }
      const results = await repo.getStagnantCandidates('c1', 3);
      assert.equal(results.length, 3);
    });

    it('should return Lead instances', async () => {
      await repo.save(new Lead(makeLeadData()));
      const results = await repo.getStagnantCandidates('c1', 10);
      assert.ok(results[0] instanceof Lead);
    });

    it('should only return leads for the specified company', async () => {
      await repo.save(new Lead(makeLeadData({ id: 'l1', companyId: 'c1' })));
      await repo.save(new Lead(makeLeadData({ id: 'l2', companyId: 'c2' })));

      const results = await repo.getStagnantCandidates('c1', 10);
      assert.equal(results.length, 1);
      assert.equal(results[0].companyId, 'c1');
    });
  });
});
