import { useState } from 'react';
import AgentAvatar from '../components/AgentAvatar';
import { AGENTS } from '../data/agents';
import { useTasks } from '../hooks/useTasks';
import { useToast } from '../context/ToastContext';
import { useI18n } from '../context/I18nContext';
import { isSupabaseConfigured } from '../lib/supabase';
import type { TraceStep } from '../types';

const ORCHESTRATOR = AGENTS.find(a => a.id === 'orchestrator')!;

const MOCK_TRACE: TraceStep[] = [
  { id: 't1', step: 1, type: 'prompt', label: 'User Prompt',
    content: 'Проанализировать производственный дефект на линии A3, создать отчёт и подготовить анимацию для обучения',
    latencyMs: 12, tokens: { input: 87, output: 0, cached: 0 }, status: 'ok', timestamp: '14:32:01.012' },
  { id: 't2', step: 2, type: 'tool_call', label: 'Orchestrator → Robo QC',
    content: 'route_task({ agent: "robo-qc", task: "defect_analysis", data: { line: "A3", pos: 142 } })',
    latencyMs: 8, status: 'ok', timestamp: '14:32:01.024' },
  { id: 't3', step: 3, type: 'tool_response', label: 'Robo QC → Result',
    content: '{ defects: 3, type: "surface_scratch", confidence: 0.942, heatmap: "base64..." }',
    latencyMs: 2340, tokens: { input: 312, output: 89, cached: 180 }, status: 'ok', timestamp: '14:32:03.364' },
  { id: 't4', step: 4, type: 'tool_call', label: 'Orchestrator → Romeo PhD',
    content: 'route_task({ agent: "romeo-phd", task: "generate_report", context: prev_results })',
    latencyMs: 11, status: 'ok', timestamp: '14:32:03.375' },
  { id: 't5', step: 5, type: 'llm_response', label: 'Romeo PhD → Report Draft',
    content: '## Отчёт о дефекте\n\nОбнаружены царапины класса B согласно ISO 1302...',
    latencyMs: 4120, tokens: { input: 445, output: 634, cached: 312 }, status: 'ok', timestamp: '14:32:07.495' },
  { id: 't6', step: 6, type: 'tool_call', label: 'Human-in-the-loop',
    content: 'AWAIT_APPROVAL: Неопределённость классификации >40%. Требуется подтверждение оператора.',
    latencyMs: 0, status: 'ok', timestamp: '14:32:07.500' },
];

const TYPE_COLOR: Record<string, string> = {
  tool_call: '#9d7cd8', tool_response: '#73daca', prompt: '#7aa2f7', llm_response: '#6c7086',
};
const TYPE_LABEL: Record<string, string> = {
  prompt: 'PROMPT', tool_call: 'TOOL CALL', tool_response: 'TOOL RESP', llm_response: 'LLM RESP',
};

export default function Workspace() {
  const { tasks, loading, addTask, approveTask, clearCompleted } = useTasks();
  const { toast } = useToast();
  const { t } = useI18n();
  const [prompt, setPrompt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showTrace, setShowTrace] = useState(false);
  const [traceStep, setTraceStep] = useState(0);

  const pendingApproval = tasks.filter(t => t.status === 'waiting_human');
  const runningCount = tasks.filter(t => t.status === 'running').length;
  const [mobileTrace, setMobileTrace] = useState(false);

  const STATUS_BADGE: Record<string, { label: string; className: string }> = {
    queued:        { label: t.status.queued,        className: 'text-text-muted bg-bg-card border-border-subtle' },
    running:       { label: t.status.running,       className: 'text-accent-blue bg-accent-blue bg-opacity-10 border-accent-blue border-opacity-30' },
    completed:     { label: t.status.completed,     className: 'text-accent-cyan bg-accent-cyan bg-opacity-10 border-accent-cyan border-opacity-30' },
    error:         { label: t.status.error,         className: 'text-signal-alert bg-signal-alert bg-opacity-10 border-signal-alert border-opacity-30' },
    waiting_human: { label: t.status.waiting_human, className: 'text-signal-warning bg-signal-warning bg-opacity-10 border-signal-warning border-opacity-30' },
  };

  const handleSubmit = async () => {
    if (!prompt.trim() || submitting) return;
    setSubmitting(true);
    const task = await addTask(prompt.trim());
    setSubmitting(false);
    if (task) {
      setPrompt('');
      toast(t.workspace.toastSent, 'success');
    } else {
      toast(t.workspace.toastError, 'error');
    }
  };

  const handleApprove = async (taskId: string) => {
    await approveTask(taskId);
    toast(t.workspace.toastApproved, 'success');
  };

  const handleClearCompleted = async () => {
    await clearCompleted();
    toast(t.workspace.toastCleared, 'info');
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 lg:px-8 py-5 border-b border-border-subtle flex items-center gap-3">
        <AgentAvatar color={ORCHESTRATOR.color} icon={ORCHESTRATOR.icon} status={runningCount > 0 ? 'computing' : 'idle'} size="sm" />
        <div>
          <h1 className="text-base font-semibold text-text-primary">{t.workspace.title}</h1>
          <p className="text-xs text-text-muted">
            {t.workspace.subtitle} · {tasks.length} {t.workspace.tasks}
            {!isSupabaseConfigured && <span className="ml-2 opacity-60">{t.workspace.demoMode}</span>}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {tasks.some(t => t.status === 'completed') && (
            <button onClick={handleClearCompleted} className="btn-ghost text-xs border border-border-subtle hidden sm:inline-flex">
              {t.workspace.clearDone}
            </button>
          )}
          {/* Mobile trace toggle */}
          <button
            onClick={() => setMobileTrace(v => !v)}
            className="md:hidden btn-ghost text-xs border border-border-subtle flex items-center gap-1"
          >
            ◎ {t.workspace.traceTitle}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: pipeline */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Input */}
          <div className="glass-panel p-4">
            <div className="text-xs text-text-muted uppercase tracking-widest mb-3">{t.workspace.newTaskLabel}</div>
            <div className="flex gap-2">
              <input
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder={t.workspace.placeholder}
                className="flex-1 bg-bg-card border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted outline-none focus:border-accent-blue transition-colors"
              />
              <button onClick={handleSubmit} disabled={submitting || !prompt.trim()} className="btn-primary px-4 flex items-center gap-1.5 disabled:opacity-60">
                {submitting && <span className="w-3 h-3 border-2 border-bg-primary border-t-transparent rounded-full animate-spin" />}
                {t.workspace.send}
              </button>
            </div>
          </div>

          {/* Human-in-the-loop alerts */}
          {pendingApproval.map(task => (
            <div key={task.id} className="glass-panel p-4 border border-signal-warning border-opacity-40 bg-signal-warning bg-opacity-5">
              <div className="flex items-start gap-3">
                <span className="text-signal-warning text-lg shrink-0">⚠</span>
                <div className="flex-1">
                  <div className="text-sm font-medium text-signal-warning mb-1">{t.workspace.humanAlert}</div>
                  <div className="text-xs text-text-secondary mb-2 truncate">{task.title}</div>
                  <div className="text-xs text-text-secondary mb-3">{t.workspace.humanDesc}</div>
                  <div className="flex gap-2">
                    <button onClick={() => handleApprove(task.id)} className="btn-primary text-xs py-1.5 px-3">
                      {t.workspace.approve}
                    </button>
                    <button className="btn-ghost text-xs py-1.5 px-3 border border-border-subtle">
                      {t.workspace.reject}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Task pipeline */}
          <div className="glass-panel p-5">
            <div className="text-xs text-text-muted uppercase tracking-widest mb-5">{t.workspace.pipeline}</div>

            {/* Orchestrator node */}
            <div className="flex items-center gap-3 mb-4">
              <AgentAvatar color={ORCHESTRATOR.color} icon={ORCHESTRATOR.icon} status={runningCount > 0 ? 'computing' : 'idle'} size="sm" />
              <div className="text-sm font-medium text-text-primary">OrchestratorCore</div>
              <span className="ml-auto text-xs text-text-muted">{tasks.length} {t.workspace.tasks}</span>
            </div>

            <div className="ml-5 border-l border-border-subtle pl-6 space-y-3">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-16 rounded-lg bg-bg-card animate-pulse" />
                ))
              ) : tasks.length === 0 ? (
                <div className="py-6 space-y-4">
                  <div className="text-center">
                    <div className="text-3xl mb-2 opacity-30">⬡</div>
                    <div className="text-sm font-medium text-text-secondary">{t.workspace.onboardingTitle}</div>
                    <div className="text-xs text-text-muted mt-1">{t.workspace.onboardingDesc}</div>
                  </div>
                  <div className="space-y-2">
                    {t.workspace.examples.map((ex: string) => (
                      <button
                        key={ex}
                        onClick={() => setPrompt(ex)}
                        className="w-full text-left px-3 py-2.5 rounded-lg border border-border-subtle bg-bg-card hover:border-accent-blue hover:bg-accent-blue hover:bg-opacity-5 transition-colors text-xs text-text-secondary"
                      >
                        <span className="text-accent-blue mr-2">→</span>{ex}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                tasks.map(task => {
                  const agent = AGENTS.find(a => a.id === task.assignedTo);
                  const badge = STATUS_BADGE[task.status] ?? STATUS_BADGE.queued;
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
                        <div className="text-xs text-text-muted">{agent?.name ?? task.assignedTo} · {task.createdAt}</div>
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
                })
              )}
            </div>
          </div>
        </div>

        {/* Right: trace panel — hidden on mobile, shown as bottom sheet via mobileTrace */}
        <div className={`
          border-border-subtle flex-col overflow-hidden
          hidden md:flex md:w-80 md:border-l
          ${mobileTrace ? '!flex fixed inset-x-0 bottom-0 z-40 h-2/3 bg-bg-secondary border-t rounded-t-xl shadow-2xl' : ''}
        `}>
          <div className="px-4 py-3 border-b border-border-subtle flex items-center gap-2">
            <span className="text-xs uppercase tracking-widest text-text-muted flex-1">{t.workspace.traceTitle}</span>
            <button onClick={() => { setShowTrace(v => !v); setTraceStep(0); }}
              className="text-xs text-accent-blue hover:underline">
              {showTrace ? t.workspace.traceHide : t.workspace.traceShow}
            </button>
            {mobileTrace && (
              <button onClick={() => setMobileTrace(false)}
                className="md:hidden ml-1 text-text-muted hover:text-text-primary text-sm">✕</button>
            )}
          </div>

          {showTrace ? (
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {MOCK_TRACE.slice(0, traceStep + 1).map(step => (
                <div key={step.id} className="bg-bg-card rounded-lg p-3 border-l-2"
                  style={{ borderLeftColor: TYPE_COLOR[step.type] }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-mono font-medium" style={{ color: TYPE_COLOR[step.type] }}>
                      {TYPE_LABEL[step.type]}
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
              ))}
              {traceStep < MOCK_TRACE.length - 1 && (
                <button onClick={() => setTraceStep(s => s + 1)}
                  className="w-full text-xs text-accent-blue hover:underline py-2">
                  {t.workspace.traceNext}
                </button>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-6">
              <div>
                <div className="text-2xl text-text-muted mb-2">◎</div>
                <div className="text-xs text-text-muted">{t.workspace.traceEmpty}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
