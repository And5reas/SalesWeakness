import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { ConfigureStageSlaUseCase } from '../../../src/application/use-cases/ConfigureStageSlaUseCase.js';
import { InMemoryStageRepository } from '../../../src/infrastructure/repositories/InMemoryStageRepository.js';
import { Stage } from '../../../src/domain/entities/Stage.js';

describe('ConfigureStageSlaUseCase', () => {
  let stageRepo;
  let useCase;

  beforeEach(() => {
    stageRepo = new InMemoryStageRepository();
    useCase = new ConfigureStageSlaUseCase({ stageRepository: stageRepo });
  });

  it('should set a valid SLA limit on an existing stage', async () => {
    await stageRepo.save(new Stage({ id: 's1', name: 'Triagem', companyId: 'c1', slaLimit: null }));

    const result = await useCase.execute({ stageId: 's1', companyId: 'c1', slaLimitHours: 24 });

    assert.equal(result.slaLimit, 24);

    const persisted = await stageRepo.findById({ stageId: 's1', companyId: 'c1' });
    assert.equal(persisted.slaLimit, 24);
  });

  it('should allow setting SLA limit to zero', async () => {
    await stageRepo.save(new Stage({ id: 's1', name: 'Triagem', companyId: 'c1' }));
    const result = await useCase.execute({ stageId: 's1', companyId: 'c1', slaLimitHours: 0 });
    assert.equal(result.slaLimit, 0);
  });

  it('should throw when stage is not found', async () => {
    await assert.rejects(
      () => useCase.execute({ stageId: 's-none', companyId: 'c1', slaLimitHours: 8 }),
      /Stage not found/
    );
  });

  it('should throw when slaLimitHours is negative', async () => {
    await stageRepo.save(new Stage({ id: 's1', name: 'Triagem', companyId: 'c1' }));
    await assert.rejects(
      () => useCase.execute({ stageId: 's1', companyId: 'c1', slaLimitHours: -1 }),
      /SLA limit cannot be negative/
    );
  });

  it('should not allow access to a stage belonging to a different company', async () => {
    await stageRepo.save(new Stage({ id: 's1', name: 'Triagem', companyId: 'c1' }));
    await assert.rejects(
      () => useCase.execute({ stageId: 's1', companyId: 'c2', slaLimitHours: 8 }),
      /Stage not found/
    );
  });
});
