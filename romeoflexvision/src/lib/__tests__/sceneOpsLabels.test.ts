import { describe, it, expect } from 'vitest';
import { queueStateLabel, bassitoStatusLabel } from '../sceneOpsLabels';

describe('queueStateLabel', () => {
  it('returns Ready for "ready"', () => {
    const result = queueStateLabel('ready');
    expect(result.label).toBe('Ready');
    expect(result.className).toContain('accent-cyan');
  });

  it('returns Andrew Review for "reviewing"', () => {
    const result = queueStateLabel('reviewing');
    expect(result.label).toBe('Andrew Review');
    expect(result.className).toContain('accent-blue');
  });

  it('returns Waiting Bassito for "waiting_bassito"', () => {
    const result = queueStateLabel('waiting_bassito');
    expect(result.label).toBe('Waiting Bassito');
    expect(result.className).toContain('signal-warning');
  });

  it('returns Completed for "completed" (default case)', () => {
    const result = queueStateLabel('completed');
    expect(result.label).toBe('Completed');
    expect(result.className).toContain('text-secondary');
  });
});

describe('bassitoStatusLabel', () => {
  it('returns Queued for "queued"', () => {
    expect(bassitoStatusLabel('queued')).toBe('Queued');
  });

  it('returns Running for "running"', () => {
    expect(bassitoStatusLabel('running')).toBe('Running');
  });

  it('returns Failed for "failed"', () => {
    expect(bassitoStatusLabel('failed')).toBe('Failed');
  });

  it('returns Stub done for "completed_stub" (default case)', () => {
    expect(bassitoStatusLabel('completed_stub')).toBe('Stub done');
  });
});
