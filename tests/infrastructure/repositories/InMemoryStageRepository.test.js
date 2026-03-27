import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryStageRepository } from '../../../src/infrastructure/repositories/InMemoryStageRepository.js';
import { Stage } from '../../../src/domain/entities/Stage.js';

const makeStageData = (overrides = {}) => ({
  id: 's1',
  name: 'Triagem',
  companyId: 'c1',
  slaLimit: 2,
  ...overrides,
});

describe('InMemoryStageRepository', () => {
  let repo;

  beforeEach(() => {
    repo = new InMemoryStageRepository();
  });

  describe('save()', () => {
    it('should persist a new stage', async () => {
      const stage = new Stage(makeStageData());
      await repo.save(stage);
      const found = await repo.findById({ stageId: 's1', companyId: 'c1' });
      assert.ok(found);
      assert.equal(found.id, 's1');
    });

    it('should update an existing stage', async () => {
      const stage = new Stage(makeStageData({ slaLimit: 2 }));
      await repo.save(stage);

      const updated = new Stage(makeStageData({ slaLimit: 48 }));
      await repo.save(updated);

      const result = await repo.findById({ stageId: 's1', companyId: 'c1' });
      assert.equal(result.slaLimit, 48);

      const all = await repo.findAllByCompany('c1');
      assert.equal(all.length, 1);
    });
  });

  describe('findById()', () => {
    it('should return a Stage instance when found', async () => {
      await repo.save(new Stage(makeStageData()));
      const result = await repo.findById({ stageId: 's1', companyId: 'c1' });
      assert.ok(result instanceof Stage);
      assert.equal(result.name, 'Triagem');
    });

    it('should return null when stage does not exist', async () => {
      const result = await repo.findById({ stageId: 's-none', companyId: 'c1' });
      assert.equal(result, null);
    });

    it('should return null when companyId does not match', async () => {
      await repo.save(new Stage(makeStageData({ companyId: 'c1' })));
      const result = await repo.findById({ stageId: 's1', companyId: 'c2' });
      assert.equal(result, null);
    });
  });

  describe('findAllByCompany()', () => {
    it('should return all stages for a given company', async () => {
      await repo.save(new Stage(makeStageData({ id: 's1', companyId: 'c1' })));
      await repo.save(new Stage(makeStageData({ id: 's2', companyId: 'c1' })));
      await repo.save(new Stage(makeStageData({ id: 's3', companyId: 'c2' })));

      const results = await repo.findAllByCompany('c1');
      assert.equal(results.length, 2);
      results.forEach(s => assert.equal(s.companyId, 'c1'));
    });

    it('should return Stage instances', async () => {
      await repo.save(new Stage(makeStageData()));
      const results = await repo.findAllByCompany('c1');
      assert.ok(results[0] instanceof Stage);
    });

    it('should return an empty array when no stages exist for the company', async () => {
      const results = await repo.findAllByCompany('c-unknown');
      assert.deepEqual(results, []);
    });
  });
});
