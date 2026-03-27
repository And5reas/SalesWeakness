import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Stage } from '../../../src/domain/entities/Stage.js';

describe('Stage entity', () => {
  describe('constructor', () => {
    it('should initialize all properties correctly', () => {
      const stage = new Stage({ id: 's1', name: 'Triagem', companyId: 'c1', slaLimit: 24 });
      assert.equal(stage.id, 's1');
      assert.equal(stage.name, 'Triagem');
      assert.equal(stage.companyId, 'c1');
      assert.equal(stage.slaLimit, 24);
    });

    it('should default slaLimit to null when not provided', () => {
      const stage = new Stage({ id: 's1', name: 'Triagem', companyId: 'c1' });
      assert.equal(stage.slaLimit, null);
    });
  });

  describe('setSlaLimit()', () => {
    it('should set slaLimit to a valid positive value', () => {
      const stage = new Stage({ id: 's1', name: 'Triagem', companyId: 'c1' });
      stage.setSlaLimit(48);
      assert.equal(stage.slaLimit, 48);
    });

    it('should allow setting slaLimit to zero', () => {
      const stage = new Stage({ id: 's1', name: 'Triagem', companyId: 'c1' });
      stage.setSlaLimit(0);
      assert.equal(stage.slaLimit, 0);
    });

    it('should throw an error when slaLimit is negative', () => {
      const stage = new Stage({ id: 's1', name: 'Triagem', companyId: 'c1' });
      assert.throws(() => stage.setSlaLimit(-1), /SLA Limit cannot be negative/);
    });
  });
});
