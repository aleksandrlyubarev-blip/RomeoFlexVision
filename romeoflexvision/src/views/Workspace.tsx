import { useState, useEffect } from 'react';
import AgentAvatar from '../components/AgentAvatar';
import SceneOpsPanel from '../components/SceneOpsPanel';
import { AGENTS } from '../data/agents';
import { loadSceneOpsSnapshot } from '../lib/sceneOps';
import type { SceneOpsSnapshot, Task, TraceStep } from '../types';

const ORCHESTRATOR = AGENTS.find(a => a.id === 'orchestrator')!;

const MOCK_TRACE: TraceStep[] = [
  {
    id: 't1', step: 1, type: 'prompt', label: 'User Prompt',
    content: 'Проанализировать производственный дефект на линии A3, создать отчёт и подготовить анимацию для обучения',
    latencyMs: 12, tokens: { input: 87, output: 0, cached: 0 }, status: 'ok',
    timestamp: '14:32:01.012',
  },
  {
    id: 't2', step: 2, type: 'tool_call', label: 'Orchestrator → Robo QC',
    content: 'route_task({ agent: "robo-qc", task: "defect_analysis", data: { line: "A3", pos: 142 } })',
    latencyMs: 8, status: 'ok', timestamp: '14:32:01.024',
  },
  {
    id: 't3', step: 3, type: 'tool_response', label: 'Robo QC → Result',
    content: '{ defects: 3, type: "surface_scratch", confidence: 0.942, heatmap: "base64..." }',
    latencyMs: 2340, tokens: { input: 312, output: 89, cached: 180 }, status: 'ok',
    timestamp: '14:32:03.364',
  },
  {
    id: 't4', step: 4, type: 'tool_call', label: 'Orchestrator → Romeo PhD',
    content: 'route_task({ agent: "romeo-phd", task: "generate_report", context: prev_results })',
    latencyMs: 11, status: 'ok', timestamp: '14:32:03.375',
  },
  {
    id: 't5', step: 5, type: 'llm_response', label: 'Romeo PhD → Report Draft',
    content: '## Отчёт о дефекте\n\nОбнаружены царапины класса B согласно ISO 1302...',
    latencyMs: 4120, tokens: { input: 445, output: 634, cached: 312 }, status: 'ok',
    timestamp: '14:32:07.495',
  },
  {
    id: 't6', step: 6, type: 'tool_call', label: 'Human-in-the-loop',
    content: 'AWAIT_APPROVAL: Неопределённость классификации >40%. Требуется подтверждение оператора.',
    latencyMs: 0, status: 'ok', timestamp: '14:32:07.500',
  },
];

const INIT_TASKS: Task[] = [
  { id: '1', title: 'Анализ дефекта линия A3', assignedTo: 'robo-qc', status: 'completed', progress: 100, createdAt: '14:32:01' },
  { id: '2', title: 'Генерация технического отчёта', assignedTo: 'romeo-phd', status: 'completed', progress: 100, createdAt: '14:32:03' },
  { id: '3', title: 'Создание обучающей анимации', assignedTo: 'bassito-animator', status: 'running', progress: 62, createdAt: '14:32:08' },
  { id: '4', title: 'Перевод отчёта (EN/DE)', assignedTo: 'perevodchik', status: 'queued', progress: 0, createdAt: '14:32:08' },
  { id: '5', title: 'Подтверждение оператора', assignedTo: 'orchestrator', status: 'waiting_human', progress: 0, createdAt: '14:32:07' },
];

const STATUS_BADGE: Record<Task['status'], { label: string; className: string }> = {
  queued: { label: 'В очереди', className: 'text-text-muted bg-bg-card border-border-subtle' },
  running: { label: 'Выполняется', className: 'text-accent-blue bg-accent-blue bg-opacity-10 border-accent-blue border-opacity-30' },
  completed: { label: 'Завершено', className: 'text-accent-cyan bg-accent-cyan bg-opacity-10 border-accent-cyan border-opacity-30' },
  error: { label: 'Ошибка', className: 'text-signal-alert bg-signal-alert bg-opacity-10 border-signal-alert border-opacity-30' },
  waiting_human: { label: 'Ожидает оператора', className: 'text-signal-warning bg-signal-warning bg-opacity-10 border-signal-warning border-opacity-30' },
};

const typeLabel = (t: TraceStep['type']) => ({
  prompt: 'PROMPT',
  tool_call: 'TOOL CALL',
  tool_response: 'TOOL RESP',
  llm_response: 'LLM RESP',
}[t]);

export default function Workspace() {
  const [tasks, setTasks] = useState<Task[]>(INIT_TASKS);
  const [prompt, setPrompt] = useState('');
  const [showTrace, setShowTrace] = useState(false);
  const [traceStep, setTraceStep] = useState(0);
  const [humanApproved, setHumanApproved] = useState(false);
  const [sceneOps, setSceneOps] = useState<SceneOpsSnapshot | null>(null);
  const [sceneOpsError, setSceneOpsError] = useState<string | null>(null);

  // Animate running task progress
  useEffect(() => {
    const interval = setInterval(() => {
      setTasks(prev => prev.map(t =>
        t.status === 'running' && t.progress < 100
          ? { ...t, progress: Math.min(100, t.progress + 1) }
          : t
      ));
    }, 300);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchSceneOps = () => {
      loadSceneOpsSnapshot()
        .then((snapshot) => {
          if (cancelled) return;
          setSceneOps(snapshot);
          setSceneOpsError(null);
        })
        .catch((error) => {
          if (cancelled) return;
          setSceneOpsError(error instanceof Error ? error.message : 'SceneOps unavailable');
        });
    };

    fetchSceneOps();
    const interval = setInterval(fetchSceneOps, 30000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const handleApprove = () => {
    setHumanApproved(true);
    setTasks(prev => prev.map(t =>
      t.status === 'waiting_human' ? { ...t, status: 'completed', progress: 100 } : t
    ));
  };

  const handleReject = () => {
    setHumanApproved(true);
    setTasks(prev => prev.map(t =>
      t.status === 'waiting_human' ? { ...t, status: 'error', progress: 0 } : t
    ));
  };

  const handleSubmit = () => {
    if (!prompt.trim()) return;
    const newTask: Task = {
      id: Date.now().toString(),
      title: prompt.slice(0, 60),
      assignedTo: 'orchestrator',
      status: 'running',
      progress: 0,
      createdAt: new Date().toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
    setTasks(prev => [newTask, ...prev]);
    setPrompt('');
    setShowTrace(false);
    setTraceStep(0);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-6 lg:px-8 py-5 border-b border-border-subtle flex items-center gap-3">
        <AgentAvatar color={ORCHESTRATOR.color} icon={ORCHESTRATOR.icon} status="computing" size="sm" />
        <div>
          <h1 className="text-base font-semibold text-text-primary">Рабочее пространство</h1>
          <p className="text-xs text-text-muted">Оркестратор-рабочий паттерн · {tasks.length} задач</p>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: pipeline */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Input */}
          <div className="glass-panel p-4">
            <div className="text-xs text-text-muted uppercase tracking-widest mb-3">Новая задача оркестратору</div>
            <div className="flex gap-2">
              <input
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="Опишите задачу для мультиагентной системы..."
                className="flex-1 bg-bg-card border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted outline-none focus:border-accent-blue transition-colors"
              />
              <button onClick={handleSubmit} className="btn-primary px-4">Отправить</button>
            </div>
          </div>

          {/* Human-in-the-loop alert */}
          {tasks.some(t => t.status === 'waiting_human') && !humanApproved && (
            <div className="glass-panel p-4 border border-signal-warning border-opacity-40 bg-signal-warning bg-opacity-5">
              <div className="flex items-start gap-3">
                <span className="text-signal-warning text-lg">⚠</span>
                <div className="flex-1">
                  <div className="text-sm font-medium text-signal-warning mb-1">Требуется подтверждение оператора</div>
                  <div className="text-xs text-text-secondary mb-3">
                    Агент не уверен в классификации дефекта (неопределённость &gt;40%). Проверьте результаты и подтвердите продолжение.
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleApprove} className="btn-primary text-xs py-1.5 px-3">Подтвердить и продолжить</button>
                    <button onClick={handleReject} className="btn-ghost text-xs py-1.5 px-3 border border-border-subtle">Отклонить задачу</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Orchestrator-worker visualization */}
          <div className="glass-panel p-5">
            <div className="text-xs text-text-muted uppercase tracking-widest mb-5">Конвейер выполнения задач</div>

            {/* Orchestrator node */}
            <div className="flex items-center gap-3 mb-4">
              <AgentAvatar color={ORCHESTRATOR.color} icon={ORCHESTRATOR.icon} status="computing" size="sm" />
              <div className="text-sm font-medium text-text-primary">OrchestratorCore</div>
              <span className="ml-auto text-xs text-text-muted">{tasks.length} активных задач</span>
            </div>

            {/* Connecting line */}
            <div className="ml-5 border-l border-border-subtle pl-6 space-y-3">
              {tasks.map(task => {
                const agent = AGENTS.find(a => a.id === task.assignedTo);
                const badge = STATUS_BADGE[task.status];
                return (
                  <div key={task.id} className="flex items-center gap-3 bg-bg-card rounded-lg p-3">
                    {agent && (
                      <AgentAvatar
                        color={agent.color} icon={agent.icon}
                        status={task.status === 'running' ? 'computing' : task.status === 'error' ? 'error' : 'idle'}
                        size="sm" animate={task.status === 'running'} />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-text-primary truncate">{task.title}</div>
                      <div className="text-xs text-text-muted">{agent?.name} · {task.createdAt}</div>
                      {task.status === 'running' && (
                        <div className="mt-1.5 h-1 bg-bg-panel rounded-full overflow-hidden">
                          <div className="h-full bg-accent-blue rounded-full transition-all duration-300"
                            style={{ width: `${task.progress}%` }} />
                        </div>
                      )}
                    </div>
                    <span className={`tag border text-xs shrink-0 ${badge.className}`}>{badge.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {sceneOps ? (
            <SceneOpsPanel snapshot={sceneOps} />
          ) : (
            <div className="glass-panel p-4 text-sm text-text-muted">
              {sceneOpsError ?? 'Загрузка SceneOps...'}
            </div>
          )}
        </div>

        {/* Right: trace panel */}
        <div className="w-80 border-l border-border-subtle flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-border-subtle flex items-center gap-2">
            <span className="text-xs uppercase tracking-widest text-text-muted flex-1">Трассировка вызовов</span>
            <button
              onClick={() => { setShowTrace(!showTrace); setTraceStep(0); }}
              className="text-xs text-accent-blue hover:underline">
              {showTrace ? 'Скрыть' : 'Показать демо'}
            </button>
          </div>

          {showTrace ? (
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {MOCK_TRACE.slice(0, traceStep + 1).map(step => {
                return (
                  <div key={step.id} className={`bg-bg-card rounded-lg p-3 border-l-2 border-l-accent-blue`}
                    style={{ borderLeftColor: step.type === 'tool_call' ? '#9d7cd8' : step.type === 'tool_response' ? '#73daca' : step.type === 'prompt' ? '#7aa2f7' : '#6c7086' }}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-mono font-medium" style={{ color: step.type === 'tool_call' ? '#9d7cd8' : step.type === 'tool_response' ? '#73daca' : step.type === 'prompt' ? '#7aa2f7' : '#6c7086' }}>
                        {typeLabel(step.type)}
                      </span>
                      <span className="text-xs text-text-muted">{step.timestamp}</span>
                      <span className="ml-auto text-xs font-mono text-text-muted">{step.latencyMs}ms</span>
                    </div>
                    <div className="text-xs text-text-secondary font-medium mb-1">{step.label}</div>
                    <div className="text-xs font-mono text-text-muted leading-relaxed bg-bg-panel rounded p-2 overflow-x-auto whitespace-pre-wrap break-all">
                      {step.content.slice(0, 120)}{step.content.length > 120 ? '...' : ''}
                    </div>
                    {step.tokens && (
                      <div className="flex gap-3 mt-2 text-xs font-mono">
                        <span className="text-text-muted">in: <span className="text-text-secondary">{step.tokens.input}</span></span>
                        <span className="text-text-muted">out: <span className="text-text-secondary">{step.tokens.output}</span></span>
                        <span className="text-text-muted">cache: <span className="text-accent-cyan">{step.tokens.cached}</span></span>
                      </div>
                    )}
                  </div>
                );
              })}
              {traceStep < MOCK_TRACE.length - 1 && (
                <button onClick={() => setTraceStep(s => s + 1)}
                  className="w-full text-xs text-accent-blue hover:underline py-2">
                  Следующий шаг ↓
                </button>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-6">
              <div>
                <div className="text-2xl text-text-muted mb-2">◎</div>
                <div className="text-xs text-text-muted">Нажмите «Показать демо» для пошаговой отладки агента</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
