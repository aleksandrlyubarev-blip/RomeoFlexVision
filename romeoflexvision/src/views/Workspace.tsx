import { useEffect, useMemo, useState } from 'react';
import AgentAvatar from '../components/AgentAvatar';
import SceneOpsPanel from '../components/SceneOpsPanel';
import { type Language, useLanguage } from '../context/LanguageContext';
import { getAgents } from '../data/agents';
import { loadSceneOpsSnapshot } from '../lib/sceneOps';
import type { SceneOpsSnapshot, Task, TraceStep } from '../types';

const COPY: Record<
  Language,
  {
    title: string;
    subtitle: string;
    newTask: string;
    placeholder: string;
    submit: string;
    operatorApprovalTitle: string;
    operatorApprovalBody: string;
    approve: string;
    reject: string;
    pipeline: string;
    activeTasks: string;
    sceneOpsLoading: string;
    trace: string;
    hideTrace: string;
    showDemo: string;
    nextStep: string;
    traceHint: string;
    traceTypes: Record<TraceStep['type'], string>;
    tasks: Array<{ title: string; assignedTo: string; status: Task['status']; progress: number; createdAt: string }>;
    traceSteps: Array<Omit<TraceStep, 'id' | 'step'>>;
    statusLabels: Record<Task['status'], string>;
  }
> = {
  en: {
    title: 'Workspace',
    subtitle: 'Orchestrator work pattern',
    newTask: 'New orchestrator task',
    placeholder: 'Describe a task for the multi-agent system...',
    submit: 'Submit',
    operatorApprovalTitle: 'Operator approval required',
    operatorApprovalBody:
      'The agent is not confident in the defect classification. Review the result and confirm whether execution should continue.',
    approve: 'Approve and continue',
    reject: 'Reject task',
    pipeline: 'Task execution pipeline',
    activeTasks: 'active tasks',
    sceneOpsLoading: 'Loading SceneOps...',
    trace: 'Call trace',
    hideTrace: 'Hide',
    showDemo: 'Show demo',
    nextStep: 'Next step',
    traceHint: 'Open the demo trace to inspect the agent flow step by step.',
    traceTypes: {
      prompt: 'PROMPT',
      tool_call: 'TOOL CALL',
      tool_response: 'TOOL RESP',
      llm_response: 'LLM RESP',
    },
    tasks: [
      { title: 'Analyze defect on line A3', assignedTo: 'robo-qc', status: 'completed', progress: 100, createdAt: '14:32:01' },
      { title: 'Generate technical report draft', assignedTo: 'romeo-phd', status: 'completed', progress: 100, createdAt: '14:32:03' },
      { title: 'Create training animation', assignedTo: 'bassito-animator', status: 'running', progress: 62, createdAt: '14:32:08' },
      { title: 'Translate report (EN/DE)', assignedTo: 'perevodchik', status: 'queued', progress: 0, createdAt: '14:32:08' },
      { title: 'Operator confirmation', assignedTo: 'orchestrator', status: 'waiting_human', progress: 0, createdAt: '14:32:07' },
    ],
    traceSteps: [
      {
        type: 'prompt',
        label: 'User prompt',
        content:
          'Analyze the production defect on line A3, draft a report, and prepare training animation assets.',
        latencyMs: 12,
        tokens: { input: 87, output: 0, cached: 0 },
        status: 'ok',
        timestamp: '14:32:01.012',
      },
      {
        type: 'tool_call',
        label: 'Orchestrator -> Robo QC',
        content:
          'route_task({ agent: "robo-qc", task: "defect_analysis", data: { line: "A3", pos: 142 } })',
        latencyMs: 8,
        status: 'ok',
        timestamp: '14:32:01.024',
      },
      {
        type: 'tool_response',
        label: 'Robo QC -> Result',
        content:
          '{ defects: 3, type: "surface_scratch", confidence: 0.942, heatmap: "base64..." }',
        latencyMs: 2340,
        tokens: { input: 312, output: 89, cached: 180 },
        status: 'ok',
        timestamp: '14:32:03.364',
      },
      {
        type: 'tool_call',
        label: 'Orchestrator -> Romeo PhD',
        content:
          'route_task({ agent: "romeo-phd", task: "generate_report", context: prev_results })',
        latencyMs: 11,
        status: 'ok',
        timestamp: '14:32:03.375',
      },
      {
        type: 'llm_response',
        label: 'Romeo PhD -> Report draft',
        content:
          '## Defect report\n\nSurface scratches were detected and classified as class B according to ISO 1302...',
        latencyMs: 4120,
        tokens: { input: 445, output: 634, cached: 312 },
        status: 'ok',
        timestamp: '14:32:07.495',
      },
      {
        type: 'tool_call',
        label: 'Human-in-the-loop',
        content:
          'AWAIT_APPROVAL: classification uncertainty above threshold. Operator confirmation required.',
        latencyMs: 0,
        status: 'ok',
        timestamp: '14:32:07.500',
      },
    ],
    statusLabels: {
      queued: 'Queued',
      running: 'Running',
      completed: 'Completed',
      error: 'Error',
      waiting_human: 'Waiting for operator',
    },
  },
  ru: {
    title: 'Рабочее пространство',
    subtitle: 'Паттерн работы оркестратора',
    newTask: 'Новая задача оркестратору',
    placeholder: 'Опишите задачу для мультиагентной системы...',
    submit: 'Отправить',
    operatorApprovalTitle: 'Требуется подтверждение оператора',
    operatorApprovalBody:
      'Агент не уверен в классификации дефекта. Проверьте результат и подтвердите, нужно ли продолжать выполнение.',
    approve: 'Подтвердить и продолжить',
    reject: 'Отклонить задачу',
    pipeline: 'Конвейер выполнения задач',
    activeTasks: 'активных задач',
    sceneOpsLoading: 'Загрузка SceneOps...',
    trace: 'Трассировка вызовов',
    hideTrace: 'Скрыть',
    showDemo: 'Показать демо',
    nextStep: 'Следующий шаг',
    traceHint: 'Откройте демо-трассировку, чтобы пошагово посмотреть работу агента.',
    traceTypes: {
      prompt: 'ПРОМПТ',
      tool_call: 'ВЫЗОВ TOOL',
      tool_response: 'ОТВЕТ TOOL',
      llm_response: 'ОТВЕТ LLM',
    },
    tasks: [
      { title: 'Анализ дефекта на линии A3', assignedTo: 'robo-qc', status: 'completed', progress: 100, createdAt: '14:32:01' },
      { title: 'Генерация черновика технического отчёта', assignedTo: 'romeo-phd', status: 'completed', progress: 100, createdAt: '14:32:03' },
      { title: 'Создание обучающей анимации', assignedTo: 'bassito-animator', status: 'running', progress: 62, createdAt: '14:32:08' },
      { title: 'Перевод отчёта (EN/DE)', assignedTo: 'perevodchik', status: 'queued', progress: 0, createdAt: '14:32:08' },
      { title: 'Подтверждение оператора', assignedTo: 'orchestrator', status: 'waiting_human', progress: 0, createdAt: '14:32:07' },
    ],
    traceSteps: [
      {
        type: 'prompt',
        label: 'Промпт пользователя',
        content:
          'Проанализировать производственный дефект на линии A3, подготовить отчёт и ассеты для обучающей анимации.',
        latencyMs: 12,
        tokens: { input: 87, output: 0, cached: 0 },
        status: 'ok',
        timestamp: '14:32:01.012',
      },
      {
        type: 'tool_call',
        label: 'Orchestrator -> Robo QC',
        content:
          'route_task({ agent: "robo-qc", task: "defect_analysis", data: { line: "A3", pos: 142 } })',
        latencyMs: 8,
        status: 'ok',
        timestamp: '14:32:01.024',
      },
      {
        type: 'tool_response',
        label: 'Robo QC -> Результат',
        content:
          '{ defects: 3, type: "surface_scratch", confidence: 0.942, heatmap: "base64..." }',
        latencyMs: 2340,
        tokens: { input: 312, output: 89, cached: 180 },
        status: 'ok',
        timestamp: '14:32:03.364',
      },
      {
        type: 'tool_call',
        label: 'Orchestrator -> Romeo PhD',
        content:
          'route_task({ agent: "romeo-phd", task: "generate_report", context: prev_results })',
        latencyMs: 11,
        status: 'ok',
        timestamp: '14:32:03.375',
      },
      {
        type: 'llm_response',
        label: 'Romeo PhD -> Черновик отчёта',
        content:
          '## Отчёт о дефекте\n\nОбнаружены поверхностные царапины, классифицированные как класс B согласно ISO 1302...',
        latencyMs: 4120,
        tokens: { input: 445, output: 634, cached: 312 },
        status: 'ok',
        timestamp: '14:32:07.495',
      },
      {
        type: 'tool_call',
        label: 'Human-in-the-loop',
        content:
          'AWAIT_APPROVAL: неопределённость классификации выше порога. Требуется подтверждение оператора.',
        latencyMs: 0,
        status: 'ok',
        timestamp: '14:32:07.500',
      },
    ],
    statusLabels: {
      queued: 'В очереди',
      running: 'Выполняется',
      completed: 'Завершено',
      error: 'Ошибка',
      waiting_human: 'Ожидает оператора',
    },
  },
  he: {
    title: 'מרחב עבודה',
    subtitle: 'תבנית העבודה של המתזמר',
    newTask: 'משימה חדשה למתזמר',
    placeholder: 'תאר משימה עבור המערכת הרב-סוכנית...',
    submit: 'שלח',
    operatorApprovalTitle: 'נדרש אישור מפעיל',
    operatorApprovalBody:
      'הסוכן אינו בטוח בסיווג הפגם. בדוק את התוצאה ואשר אם להמשיך את הביצוע.',
    approve: 'אשר והמשך',
    reject: 'דחה משימה',
    pipeline: 'צינור ביצוע המשימות',
    activeTasks: 'משימות פעילות',
    sceneOpsLoading: 'טוען SceneOps...',
    trace: 'מעקב קריאות',
    hideTrace: 'הסתר',
    showDemo: 'הצג דמו',
    nextStep: 'השלב הבא',
    traceHint: 'פתח את דמו המעקב כדי לבדוק את זרימת הסוכן צעד אחר צעד.',
    traceTypes: {
      prompt: 'פרומפט',
      tool_call: 'קריאת TOOL',
      tool_response: 'תשובת TOOL',
      llm_response: 'תשובת LLM',
    },
    tasks: [
      { title: 'ניתוח פגם בקו A3', assignedTo: 'robo-qc', status: 'completed', progress: 100, createdAt: '14:32:01' },
      { title: 'יצירת טיוטת דו"ח טכני', assignedTo: 'romeo-phd', status: 'completed', progress: 100, createdAt: '14:32:03' },
      { title: 'יצירת אנימציית הדרכה', assignedTo: 'bassito-animator', status: 'running', progress: 62, createdAt: '14:32:08' },
      { title: 'תרגום דו"ח (EN/DE)', assignedTo: 'perevodchik', status: 'queued', progress: 0, createdAt: '14:32:08' },
      { title: 'אישור מפעיל', assignedTo: 'orchestrator', status: 'waiting_human', progress: 0, createdAt: '14:32:07' },
    ],
    traceSteps: [
      {
        type: 'prompt',
        label: 'פרומפט משתמש',
        content:
          'נתח את הפגם בייצור בקו A3, הכן דו"ח והכן נכסים לאנימציית הדרכה.',
        latencyMs: 12,
        tokens: { input: 87, output: 0, cached: 0 },
        status: 'ok',
        timestamp: '14:32:01.012',
      },
      {
        type: 'tool_call',
        label: 'Orchestrator -> Robo QC',
        content:
          'route_task({ agent: "robo-qc", task: "defect_analysis", data: { line: "A3", pos: 142 } })',
        latencyMs: 8,
        status: 'ok',
        timestamp: '14:32:01.024',
      },
      {
        type: 'tool_response',
        label: 'Robo QC -> תוצאה',
        content:
          '{ defects: 3, type: "surface_scratch", confidence: 0.942, heatmap: "base64..." }',
        latencyMs: 2340,
        tokens: { input: 312, output: 89, cached: 180 },
        status: 'ok',
        timestamp: '14:32:03.364',
      },
      {
        type: 'tool_call',
        label: 'Orchestrator -> Romeo PhD',
        content:
          'route_task({ agent: "romeo-phd", task: "generate_report", context: prev_results })',
        latencyMs: 11,
        status: 'ok',
        timestamp: '14:32:03.375',
      },
      {
        type: 'llm_response',
        label: 'Romeo PhD -> טיוטת דו"ח',
        content:
          '## דו"ח פגם\n\nזוהו שריטות שטח שסווגו כדרגה B לפי ISO 1302...',
        latencyMs: 4120,
        tokens: { input: 445, output: 634, cached: 312 },
        status: 'ok',
        timestamp: '14:32:07.495',
      },
      {
        type: 'tool_call',
        label: 'Human-in-the-loop',
        content:
          'AWAIT_APPROVAL: אי-הוודאות בסיווג גבוהה מהסף. נדרש אישור מפעיל.',
        latencyMs: 0,
        status: 'ok',
        timestamp: '14:32:07.500',
      },
    ],
    statusLabels: {
      queued: 'בתור',
      running: 'בתהליך',
      completed: 'הושלם',
      error: 'שגיאה',
      waiting_human: 'ממתין למפעיל',
    },
  },
};

function buildTasks(language: Language): Task[] {
  return COPY[language].tasks.map((task, index) => ({
    id: String(index + 1),
    ...task,
  }));
}

function buildTrace(language: Language): TraceStep[] {
  return COPY[language].traceSteps.map((step, index) => ({
    id: `t${index + 1}`,
    step: index + 1,
    ...step,
  }));
}

export default function Workspace() {
  const { language, locale } = useLanguage();
  const copy = COPY[language];
  const agents = useMemo(() => getAgents(language), [language]);
  const orchestrator = agents.find((agent) => agent.id === 'orchestrator');
  const trace = useMemo(() => buildTrace(language), [language]);
  const [tasks, setTasks] = useState<Task[]>(() => buildTasks(language));
  const [prompt, setPrompt] = useState('');
  const [showTrace, setShowTrace] = useState(false);
  const [traceStep, setTraceStep] = useState(0);
  const [humanApproved, setHumanApproved] = useState(false);
  const [sceneOps, setSceneOps] = useState<SceneOpsSnapshot | null>(null);
  const [sceneOpsError, setSceneOpsError] = useState<string | null>(null);

  useEffect(() => {
    setTasks(buildTasks(language));
    setPrompt('');
    setShowTrace(false);
    setTraceStep(0);
    setHumanApproved(false);
  }, [language]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTasks((previous) =>
        previous.map((task) =>
          task.status === 'running' && task.progress < 100
            ? { ...task, progress: Math.min(100, task.progress + 1) }
            : task
        )
      );
    }, 300);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let cancelled = false;

    loadSceneOpsSnapshot()
      .then((snapshot) => {
        if (cancelled) return;
        setSceneOps(snapshot);
        setSceneOpsError(null);
      })
      .catch((error) => {
        if (cancelled) return;
        setSceneOpsError(error instanceof Error ? error.message : copy.sceneOpsLoading);
      });

    return () => {
      cancelled = true;
    };
  }, [copy.sceneOpsLoading]);

  if (!orchestrator) {
    return null;
  }

  const statusBadgeClass: Record<Task['status'], string> = {
    queued: 'text-text-muted bg-bg-card border-border-subtle',
    running: 'text-accent-blue bg-accent-blue bg-opacity-10 border-accent-blue border-opacity-30',
    completed: 'text-accent-cyan bg-accent-cyan bg-opacity-10 border-accent-cyan border-opacity-30',
    error: 'text-signal-alert bg-signal-alert bg-opacity-10 border-signal-alert border-opacity-30',
    waiting_human:
      'text-signal-warning bg-signal-warning bg-opacity-10 border-signal-warning border-opacity-30',
  };

  const handleApprove = () => {
    setHumanApproved(true);
    setTasks((previous) =>
      previous.map((task) =>
        task.status === 'waiting_human'
          ? { ...task, status: 'completed', progress: 100 }
          : task
      )
    );
  };

  const handleReject = () => {
    setHumanApproved(true);
    setTasks((previous) =>
      previous.map((task) =>
        task.status === 'waiting_human'
          ? { ...task, status: 'error', progress: 0 }
          : task
      )
    );
  };

  const handleSubmit = () => {
    if (!prompt.trim()) return;

    const newTask: Task = {
      id: Date.now().toString(),
      title: prompt.slice(0, 60),
      assignedTo: 'orchestrator',
      status: 'running',
      progress: 0,
      createdAt: new Date().toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    };

    setTasks((previous) => [newTask, ...previous]);
    setPrompt('');
    setShowTrace(false);
    setTraceStep(0);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-6 lg:px-8 py-5 border-b border-border-subtle flex items-center gap-3">
        <AgentAvatar color={orchestrator.color} icon={orchestrator.icon} status="computing" size="sm" />
        <div>
          <h1 className="text-base font-semibold text-text-primary">{copy.title}</h1>
          <p className="text-xs text-text-muted">
            {copy.subtitle} · {tasks.length} {copy.activeTasks}
          </p>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="glass-panel p-4">
            <div className="text-xs text-text-muted uppercase tracking-widest mb-3">
              {copy.newTask}
            </div>
            <div className="flex gap-2">
              <input
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && handleSubmit()}
                placeholder={copy.placeholder}
                className="flex-1 bg-bg-card border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted outline-none focus:border-accent-blue transition-colors"
              />
              <button onClick={handleSubmit} className="btn-primary px-4">
                {copy.submit}
              </button>
            </div>
          </div>

          {tasks.some((task) => task.status === 'waiting_human') && !humanApproved && (
            <div className="glass-panel p-4 border border-signal-warning border-opacity-40 bg-signal-warning bg-opacity-5">
              <div className="flex items-start gap-3">
                <span className="text-signal-warning text-lg">⚠</span>
                <div className="flex-1">
                  <div className="text-sm font-medium text-signal-warning mb-1">
                    {copy.operatorApprovalTitle}
                  </div>
                  <div className="text-xs text-text-secondary mb-3">
                    {copy.operatorApprovalBody}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleApprove} className="btn-primary text-xs py-1.5 px-3">
                      {copy.approve}
                    </button>
                    <button
                      onClick={handleReject}
                      className="btn-ghost text-xs py-1.5 px-3 border border-border-subtle"
                    >
                      {copy.reject}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="glass-panel p-5">
            <div className="text-xs text-text-muted uppercase tracking-widest mb-5">
              {copy.pipeline}
            </div>

            <div className="flex items-center gap-3 mb-4">
              <AgentAvatar color={orchestrator.color} icon={orchestrator.icon} status="computing" size="sm" />
              <div className="text-sm font-medium text-text-primary">{orchestrator.name}</div>
              <span className="ml-auto text-xs text-text-muted">
                {tasks.length} {copy.activeTasks}
              </span>
            </div>

            <div className="ml-5 border-l border-border-subtle pl-6 space-y-3">
              {tasks.map((task) => {
                const agent = agents.find((item) => item.id === task.assignedTo);
                return (
                  <div key={task.id} className="flex items-center gap-3 bg-bg-card rounded-lg p-3">
                    {agent && (
                      <AgentAvatar
                        color={agent.color}
                        icon={agent.icon}
                        status={
                          task.status === 'running'
                            ? 'computing'
                            : task.status === 'error'
                              ? 'error'
                              : 'idle'
                        }
                        size="sm"
                        animate={task.status === 'running'}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-text-primary truncate">{task.title}</div>
                      <div className="text-xs text-text-muted">
                        {agent?.name} · {task.createdAt}
                      </div>
                      {task.status === 'running' && (
                        <div className="mt-1.5 h-1 bg-bg-panel rounded-full overflow-hidden">
                          <div
                            className="h-full bg-accent-blue rounded-full transition-all duration-300"
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                    <span className={`tag border text-xs shrink-0 ${statusBadgeClass[task.status]}`}>
                      {copy.statusLabels[task.status]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {sceneOps ? (
            <SceneOpsPanel snapshot={sceneOps} />
          ) : (
            <div className="glass-panel p-4 text-sm text-text-muted">
              {sceneOpsError ?? copy.sceneOpsLoading}
            </div>
          )}
        </div>

        <div className="w-80 border-l border-border-subtle flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-border-subtle flex items-center gap-2">
            <span className="text-xs uppercase tracking-widest text-text-muted flex-1">
              {copy.trace}
            </span>
            <button
              onClick={() => {
                setShowTrace(!showTrace);
                setTraceStep(0);
              }}
              className="text-xs text-accent-blue hover:underline"
            >
              {showTrace ? copy.hideTrace : copy.showDemo}
            </button>
          </div>

          {showTrace ? (
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {trace.slice(0, traceStep + 1).map((step) => (
                <div
                  key={step.id}
                  className="bg-bg-card rounded-lg p-3 border-l-2 border-l-accent-blue"
                  style={{
                    borderLeftColor:
                      step.type === 'tool_call'
                        ? '#9d7cd8'
                        : step.type === 'tool_response'
                          ? '#73daca'
                          : step.type === 'prompt'
                            ? '#7aa2f7'
                            : '#6c7086',
                  }}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className="text-xs font-mono font-medium"
                      style={{
                        color:
                          step.type === 'tool_call'
                            ? '#9d7cd8'
                            : step.type === 'tool_response'
                              ? '#73daca'
                              : step.type === 'prompt'
                                ? '#7aa2f7'
                                : '#6c7086',
                      }}
                    >
                      {copy.traceTypes[step.type]}
                    </span>
                    <span className="text-xs text-text-muted">{step.timestamp}</span>
                    <span className="ml-auto text-xs font-mono text-text-muted">
                      {step.latencyMs}ms
                    </span>
                  </div>
                  <div className="text-xs text-text-secondary font-medium mb-1">{step.label}</div>
                  <div className="text-xs font-mono text-text-muted leading-relaxed bg-bg-panel rounded p-2 overflow-x-auto whitespace-pre-wrap break-all">
                    {step.content.slice(0, 120)}
                    {step.content.length > 120 ? '...' : ''}
                  </div>
                  {step.tokens && (
                    <div className="flex gap-3 mt-2 text-xs font-mono">
                      <span className="text-text-muted">
                        in: <span className="text-text-secondary">{step.tokens.input}</span>
                      </span>
                      <span className="text-text-muted">
                        out: <span className="text-text-secondary">{step.tokens.output}</span>
                      </span>
                      <span className="text-text-muted">
                        cache: <span className="text-accent-cyan">{step.tokens.cached}</span>
                      </span>
                    </div>
                  )}
                </div>
              ))}
              {traceStep < trace.length - 1 && (
                <button
                  onClick={() => setTraceStep((current) => current + 1)}
                  className="w-full text-xs text-accent-blue hover:underline py-2"
                >
                  {copy.nextStep} ↓
                </button>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-6">
              <div>
                <div className="text-2xl text-text-muted mb-2">◌</div>
                <div className="text-xs text-text-muted">{copy.traceHint}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
