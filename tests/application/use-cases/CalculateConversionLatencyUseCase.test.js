import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { CalculateConversionLatencyUseCase } from '../../../src/application/use-cases/CalculateConversionLatencyUseCase.js';
import { InMemoryAuditLogRepository } from '../../../src/infrastructure/repositories/InMemoryAuditLogRepository.js';
import { InMemoryLeadRepository } from '../../../src/infrastructure/repositories/InMemoryLeadRepository.js';

describe('CalculateConversionLatencyUseCase', () => {
  let auditRepo;
  let leadRepo;
  let useCase;

  beforeEach(() => {
    auditRepo = new InMemoryAuditLogRepository();
    leadRepo = new InMemoryLeadRepository();
    useCase = new CalculateConversionLatencyUseCase({ auditLogRepository: auditRepo, leadRepository: leadRepo });
  });

  it('should return an empty array when there are no transition logs', async () => {
    const result = await useCase.execute('c1', null, null);
    assert.deepEqual(result, []);
  });

  it('should calculate average latency for a single transition pair', async () => {
    const transition = {
      id: 't1',
      eventType: 'STAGE_TRANSITION',
      companyId: 'c1',
      detectedAt: new Date(),
      fromStage: 'Triagem',
      toStage: 'Qualificação',
      durationMs: 2 * 60 * 60 * 1000, // 2 hours in ms
    };
    auditRepo.logs.push(transition);

    const result = await useCase.execute('c1', null, null);

    assert.equal(result.length, 1);
    assert.equal(result[0].fromStage, 'Triagem');
    assert.equal(result[0].toStage, 'Qualificação');
    assert.equal(result[0].avgLatencyHours, 2);
  });

  it('should average multiple transitions for the same stage pair', async () => {
    const makeTransition = (durationMs) => ({
      id: crypto.randomUUID(),
      eventType: 'STAGE_TRANSITION',
      companyId: 'c1',
      detectedAt: new Date(),
      fromStage: 'Triagem',
      toStage: 'Qualificação',
      durationMs,
    });

    auditRepo.logs.push(makeTransition(2 * 60 * 60 * 1000)); // 2h
    auditRepo.logs.push(makeTransition(4 * 60 * 60 * 1000)); // 4h

    const result = await useCase.execute('c1', null, null);

    assert.equal(result.length, 1);
    assert.equal(result[0].avgLatencyHours, 3); // average of 2h and 4h
  });

  it('should group distinct stage pairs separately', async () => {
    auditRepo.logs.push({ id: 't1', eventType: 'STAGE_TRANSITION', companyId: 'c1', detectedAt: new Date(), fromStage: 'A', toStage: 'B', durationMs: 1 * 60 * 60 * 1000 });
    auditRepo.logs.push({ id: 't2', eventType: 'STAGE_TRANSITION', companyId: 'c1', detectedAt: new Date(), fromStage: 'B', toStage: 'C', durationMs: 3 * 60 * 60 * 1000 });

    const result = await useCase.execute('c1', null, null);

    assert.equal(result.length, 2);
    const ab = result.find(r => r.fromStage === 'A' && r.toStage === 'B');
    const bc = result.find(r => r.fromStage === 'B' && r.toStage === 'C');
    assert.ok(ab);
    assert.ok(bc);
    assert.equal(ab.avgLatencyHours, 1);
    assert.equal(bc.avgLatencyHours, 3);
  });

  it('should fall back to createdAt - enteredStageAt when durationMs is not set', async () => {
    const enteredStageAt = new Date('2024-01-10T10:00:00.000Z');
    const createdAt = new Date('2024-01-10T12:00:00.000Z'); // 2 hours later
    auditRepo.logs.push({
      id: 't1',
      eventType: 'STAGE_TRANSITION',
      companyId: 'c1',
      detectedAt: new Date(),
      fromStage: 'A',
      toStage: 'B',
      createdAt,
      enteredStageAt,
      // durationMs intentionally omitted
    });

    const result = await useCase.execute('c1', null, null);

    assert.equal(result.length, 1);
    assert.equal(result[0].avgLatencyHours, 2);
  });
});
