import type { SceneOpsSnapshot } from '../types';

export function queueStateLabel(state: SceneOpsSnapshot['scene']['queueState']): {
  label: string;
  className: string;
} {
  switch (state) {
    case 'ready':
      return { label: 'Ready', className: 'text-accent-cyan bg-accent-cyan bg-opacity-10 border-accent-cyan border-opacity-30' };
    case 'reviewing':
      return { label: 'Andrew Review', className: 'text-accent-blue bg-accent-blue bg-opacity-10 border-accent-blue border-opacity-30' };
    case 'waiting_bassito':
      return { label: 'Waiting Bassito', className: 'text-signal-warning bg-signal-warning bg-opacity-10 border-signal-warning border-opacity-30' };
    default:
      return { label: 'Completed', className: 'text-text-secondary bg-bg-card border-border-subtle' };
  }
}

export function bassitoStatusLabel(status: SceneOpsSnapshot['bassitoJobs'][number]['status']): string {
  switch (status) {
    case 'queued':
      return 'Queued';
    case 'running':
      return 'Running';
    case 'failed':
      return 'Failed';
    default:
      return 'Stub done';
  }
}
