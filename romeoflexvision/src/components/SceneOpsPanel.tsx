import { type Language, useLanguage } from '../context/LanguageContext';
import type { SceneOpsSnapshot } from '../types';

interface SceneOpsPanelProps {
  snapshot: SceneOpsSnapshot;
}

const COPY: Record<
  Language,
  {
    queueStates: Record<SceneOpsSnapshot['scene']['queueState'], string>;
    bassitoStatuses: Record<SceneOpsSnapshot['bassitoJobs'][number]['status'], string>;
    sourceApi: string;
    sourceMock: string;
    chain: string;
    scene: string;
    timeline: string;
    drift: string;
    andrewConfidence: string;
    andrewReview: string;
    recommendedActions: string;
    warnings: string;
    bassitoJobs: string;
    sceneSelection: string;
    approvedClips: string;
    rejectedClips: string;
    hitl: string;
    clipPrefix: string;
  }
> = {
  en: {
    queueStates: { ready: 'Ready', reviewing: 'Andrew review', waiting_bassito: 'Waiting Bassito', completed: 'Completed' },
    bassitoStatuses: { queued: 'Queued', running: 'Running', failed: 'Failed', completed_stub: 'Stub done' },
    sourceApi: 'API',
    sourceMock: 'Mock',
    chain: 'PinoCut scene bundle → Andrew review → Bassito jobs',
    scene: 'Scene',
    timeline: 'Timeline',
    drift: 'Drift',
    andrewConfidence: 'Andrew confidence',
    andrewReview: 'Andrew review',
    recommendedActions: 'Recommended actions',
    warnings: 'Warnings',
    bassitoJobs: 'Bassito jobs',
    sceneSelection: 'Scene selection',
    approvedClips: 'Approved clips',
    rejectedClips: 'Rejected clips',
    hitl: 'HITL',
    clipPrefix: 'clip',
  },
  ru: {
    queueStates: { ready: 'Готово', reviewing: 'Проверка Andrew', waiting_bassito: 'Ожидание Bassito', completed: 'Завершено' },
    bassitoStatuses: { queued: 'В очереди', running: 'В работе', failed: 'Ошибка', completed_stub: 'Stub done' },
    sourceApi: 'API',
    sourceMock: 'Mock',
    chain: 'PinoCut scene bundle → Andrew review → Bassito jobs',
    scene: 'Сцена',
    timeline: 'Таймлайн',
    drift: 'Drift',
    andrewConfidence: 'Уверенность Andrew',
    andrewReview: 'Ревью Andrew',
    recommendedActions: 'Рекомендованные действия',
    warnings: 'Предупреждения',
    bassitoJobs: 'Задачи Bassito',
    sceneSelection: 'Отбор сцены',
    approvedClips: 'Одобренные клипы',
    rejectedClips: 'Отклонённые клипы',
    hitl: 'HITL',
    clipPrefix: 'clip',
  },
  he: {
    queueStates: { ready: 'מוכן', reviewing: 'בדיקת Andrew', waiting_bassito: 'ממתין ל-Bassito', completed: 'הושלם' },
    bassitoStatuses: { queued: 'בתור', running: 'בתהליך', failed: 'נכשל', completed_stub: 'הושלם כ-stub' },
    sourceApi: 'API',
    sourceMock: 'Mock',
    chain: 'PinoCut scene bundle → Andrew review → Bassito jobs',
    scene: 'סצנה',
    timeline: 'טיימליין',
    drift: 'סטייה',
    andrewConfidence: 'ביטחון Andrew',
    andrewReview: 'סקירת Andrew',
    recommendedActions: 'פעולות מומלצות',
    warnings: 'אזהרות',
    bassitoJobs: 'משימות Bassito',
    sceneSelection: 'בחירת סצנה',
    approvedClips: 'קליפים מאושרים',
    rejectedClips: 'קליפים שנדחו',
    hitl: 'HITL',
    clipPrefix: 'clip',
  },
};

export default function SceneOpsPanel({ snapshot }: SceneOpsPanelProps) {
  const { language } = useLanguage();
  const copy = COPY[language];
  const driftSec = snapshot.scene.targetDurationSec - snapshot.scene.actualDurationSec;
  const queueLabel = copy.queueStates[snapshot.scene.queueState];

  return (
    <div className="glass-panel p-5 space-y-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent-blue bg-opacity-10 border border-accent-blue border-opacity-30 flex items-center justify-center text-accent-blue">
          ▷
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="text-sm font-semibold text-text-primary">SceneOps</div>
            <span className="tag border text-text-muted border-border-subtle">{queueLabel}</span>
            <span className="tag border border-border-subtle text-text-muted">
              {snapshot.source === 'api' ? copy.sourceApi : copy.sourceMock}
            </span>
          </div>
          <div className="text-xs text-text-muted mt-1">{copy.chain}</div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        <div className="bg-bg-card rounded-lg p-3 border border-border-subtle">
          <div className="metric-label mb-1">{copy.scene}</div>
          <div className="text-sm text-text-primary font-medium">{snapshot.scene.sceneId}</div>
          <div className="text-xs text-text-muted mt-1">{snapshot.scene.sceneGoal}</div>
        </div>
        <div className="bg-bg-card rounded-lg p-3 border border-border-subtle">
          <div className="metric-label mb-1">{copy.timeline}</div>
          <div className="text-sm text-text-primary font-medium">
            {snapshot.scene.actualDurationSec.toFixed(1)}s / {snapshot.scene.targetDurationSec.toFixed(1)}s
          </div>
          <div className="text-xs text-text-muted mt-1">
            {copy.drift} {driftSec >= 0 ? '+' : ''}
            {driftSec.toFixed(1)}s
          </div>
        </div>
        <div className="bg-bg-card rounded-lg p-3 border border-border-subtle">
          <div className="metric-label mb-1">{copy.andrewConfidence}</div>
          <div className="text-sm text-text-primary font-medium">
            {Math.round(snapshot.andrew.confidence * 100)}%
          </div>
          <div className="text-xs text-text-muted mt-1">
            {copy.hitl}: {snapshot.andrew.hitlDecision}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.3fr_1fr] gap-4">
        <div className="space-y-3">
          <div className="bg-bg-card rounded-lg p-4 border border-border-subtle">
            <div className="metric-label mb-2">{copy.andrewReview}</div>
            <div className="text-sm text-text-secondary leading-relaxed">{snapshot.andrew.summary}</div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              {Object.entries(snapshot.andrew.qualityBreakdown).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center justify-between rounded-md bg-bg-panel px-2 py-1.5"
                >
                  <span className="text-text-muted">{key.replaceAll('_', ' ')}</span>
                  <span className="font-mono text-text-primary">{value.toFixed(1)}/5</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <div className="bg-bg-card rounded-lg p-4 border border-border-subtle">
              <div className="metric-label mb-2">{copy.recommendedActions}</div>
              <div className="space-y-2">
                {snapshot.andrew.recommendedActions.map((action) => (
                  <div key={action} className="text-xs text-text-secondary leading-relaxed">
                    • {action}
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-bg-card rounded-lg p-4 border border-border-subtle">
              <div className="metric-label mb-2">{copy.warnings}</div>
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
            <div className="metric-label mb-2">{copy.bassitoJobs}</div>
            <div className="space-y-2">
              {snapshot.bassitoJobs.map((job) => (
                <div key={job.jobId} className="rounded-lg bg-bg-panel px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-text-primary">{job.jobType}</span>
                    <span className="ml-auto text-xs text-text-muted">
                      {copy.bassitoStatuses[job.status]}
                    </span>
                  </div>
                  <div className="text-xs text-text-muted mt-1 font-mono break-all">{job.jobId}</div>
                  {job.sourceClipId && (
                    <div className="text-xs text-text-secondary mt-1">
                      {copy.clipPrefix}: {job.sourceClipId}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-bg-card rounded-lg p-4 border border-border-subtle">
            <div className="metric-label mb-2">{copy.sceneSelection}</div>
            <div className="text-xs text-text-muted mb-2">{copy.approvedClips}</div>
            <div className="flex flex-wrap gap-2 mb-3">
              {snapshot.scene.usedClips.map((clipId) => (
                <span
                  key={clipId}
                  className="tag border border-accent-cyan border-opacity-30 text-accent-cyan bg-accent-cyan bg-opacity-10"
                >
                  {clipId}
                </span>
              ))}
            </div>
            <div className="text-xs text-text-muted mb-2">{copy.rejectedClips}</div>
            <div className="flex flex-wrap gap-2">
              {snapshot.scene.rejectedClips.map((clipId) => (
                <span
                  key={clipId}
                  className="tag border border-border-subtle text-text-muted bg-bg-panel"
                >
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
