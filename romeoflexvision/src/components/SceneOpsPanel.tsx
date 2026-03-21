import type { SceneOpsSnapshot } from '../types';

interface SceneOpsPanelProps {
  snapshot: SceneOpsSnapshot;
}

function queueStateLabel(state: SceneOpsSnapshot['scene']['queueState']) {
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

function bassitoStatusLabel(status: SceneOpsSnapshot['bassitoJobs'][number]['status']) {
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

export default function SceneOpsPanel({ snapshot }: SceneOpsPanelProps) {
  const queueState = queueStateLabel(snapshot.scene.queueState);
  const driftSec = snapshot.scene.targetDurationSec - snapshot.scene.actualDurationSec;

  return (
    <div className="glass-panel p-5 space-y-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent-blue bg-opacity-10 border border-accent-blue border-opacity-30 flex items-center justify-center text-accent-blue">
          ▷
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="text-sm font-semibold text-text-primary">SceneOps</div>
            <span className={`tag border ${queueState.className}`}>{queueState.label}</span>
            <span className="tag border border-border-subtle text-text-muted">{snapshot.source === 'api' ? 'API' : 'Mock'}</span>
          </div>
          <div className="text-xs text-text-muted mt-1">
            PinoCut scene bundle {'->'} Andrew review {'->'} Bassito jobs
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        <div className="bg-bg-card rounded-lg p-3 border border-border-subtle">
          <div className="metric-label mb-1">Scene</div>
          <div className="text-sm text-text-primary font-medium">{snapshot.scene.sceneId}</div>
          <div className="text-xs text-text-muted mt-1">{snapshot.scene.sceneGoal}</div>
        </div>
        <div className="bg-bg-card rounded-lg p-3 border border-border-subtle">
          <div className="metric-label mb-1">Timeline</div>
          <div className="text-sm text-text-primary font-medium">
            {snapshot.scene.actualDurationSec.toFixed(1)}s / {snapshot.scene.targetDurationSec.toFixed(1)}s
          </div>
          <div className="text-xs text-text-muted mt-1">
            Drift {driftSec >= 0 ? '+' : ''}{driftSec.toFixed(1)}s
          </div>
        </div>
        <div className="bg-bg-card rounded-lg p-3 border border-border-subtle">
          <div className="metric-label mb-1">Andrew Confidence</div>
          <div className="text-sm text-text-primary font-medium">{Math.round(snapshot.andrew.confidence * 100)}%</div>
          <div className="text-xs text-text-muted mt-1">
            HITL: {snapshot.andrew.hitlDecision}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.3fr_1fr] gap-4">
        <div className="space-y-3">
          <div className="bg-bg-card rounded-lg p-4 border border-border-subtle">
            <div className="metric-label mb-2">Andrew Review</div>
            <div className="text-sm text-text-secondary leading-relaxed">
              {snapshot.andrew.summary}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              {Object.entries(snapshot.andrew.qualityBreakdown).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between rounded-md bg-bg-panel px-2 py-1.5">
                  <span className="text-text-muted">{key.replaceAll('_', ' ')}</span>
                  <span className="font-mono text-text-primary">{value.toFixed(1)}/5</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <div className="bg-bg-card rounded-lg p-4 border border-border-subtle">
              <div className="metric-label mb-2">Recommended Actions</div>
              <div className="space-y-2">
                {snapshot.andrew.recommendedActions.map((action) => (
                  <div key={action} className="text-xs text-text-secondary leading-relaxed">
                    • {action}
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-bg-card rounded-lg p-4 border border-border-subtle">
              <div className="metric-label mb-2">Warnings</div>
              <div className="space-y-2">
                {snapshot.andrew.warnings.map((warning) => (
                  <div key={warning} className="text-xs text-text-secondary leading-relaxed">
                    • {warning}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="bg-bg-card rounded-lg p-4 border border-border-subtle">
            <div className="metric-label mb-2">Bassito Jobs</div>
            <div className="space-y-2">
              {snapshot.bassitoJobs.map((job) => (
                <div key={job.jobId} className="rounded-lg bg-bg-panel px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-text-primary">{job.jobType}</span>
                    <span className="ml-auto text-xs text-text-muted">{bassitoStatusLabel(job.status)}</span>
                  </div>
                  <div className="text-xs text-text-muted mt-1 font-mono break-all">{job.jobId}</div>
                  {job.sourceClipId && (
                    <div className="text-xs text-text-secondary mt-1">clip: {job.sourceClipId}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-bg-card rounded-lg p-4 border border-border-subtle">
            <div className="metric-label mb-2">Scene Selection</div>
            <div className="text-xs text-text-muted mb-2">Approved clips</div>
            <div className="flex flex-wrap gap-2 mb-3">
              {snapshot.scene.usedClips.map((clipId) => (
                <span key={clipId} className="tag border border-accent-cyan border-opacity-30 text-accent-cyan bg-accent-cyan bg-opacity-10">
                  {clipId}
                </span>
              ))}
            </div>
            <div className="text-xs text-text-muted mb-2">Rejected clips</div>
            <div className="flex flex-wrap gap-2">
              {snapshot.scene.rejectedClips.map((clipId) => (
                <span key={clipId} className="tag border border-border-subtle text-text-muted bg-bg-panel">
                  {clipId}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
