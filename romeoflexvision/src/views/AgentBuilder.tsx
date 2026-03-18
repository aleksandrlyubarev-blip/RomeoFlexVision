import { useState, useEffect } from 'react';
import AgentAvatar from '../components/AgentAvatar';
import { useI18n } from '../context/I18nContext';
import { useToast } from '../context/ToastContext';
import type { Agent, AgentCategory, AgentStatus } from '../types';

// ---- Options ----
const ICONS = ['◈', '◉', '◆', '◇', '⬡', '⬢', '◐', '▷', '▶', '⊕', '⊗', '◑', '◒', '◓'];
const COLORS = [
  '#7aa2f7', '#9d7cd8', '#73daca', '#ff9e64',
  '#e0af68', '#f7768e', '#b4f9f8', '#9ece6a',
  '#2ac3de', '#bb9af7', '#7dcfff', '#ff007c',
];
const TOOLS_LIST = [
  'computer_vision', 'web_search', 'code_execution', 'file_read',
  'database_query', 'api_call', 'llm_inference', 'image_gen',
  'data_analysis', 'pdf_parse', 'translation', 'tts',
];

interface AgentDraft {
  name: string;
  icon: string;
  color: string;
  category: AgentCategory;
  systemPrompt: string;
  tools: string[];
  subAgents: number;
}

const INITIAL: AgentDraft = {
  name: '',
  icon: '◈',
  color: '#7aa2f7',
  category: 'analytic',
  systemPrompt: '',
  tools: [],
  subAgents: 0,
};

function agentToDraft(agent: Agent): AgentDraft {
  return {
    name: agent.name,
    icon: agent.icon,
    color: agent.color,
    category: agent.category === 'orchestrator' ? 'analytic' : agent.category,
    systemPrompt: agent.description,
    tools: agent.dataSources,
    subAgents: agent.subAgents,
  };
}

function StepDot({ n, current }: { n: number; current: number }) {
  return (
    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-medium transition-all duration-200 ${
      n < current  ? 'bg-accent-blue text-bg-primary'
      : n === current ? 'bg-accent-blue bg-opacity-20 text-accent-blue border border-accent-blue'
      : 'bg-bg-card text-text-muted border border-border-subtle'
    }`}>{n + 1}</div>
  );
}

// ---- Props ----
interface BuilderProps {
  initialAgent?: Agent | null;
  onGoToCatalog?: () => void;
}

// ---- Save to localStorage ----
function persistCustomAgent(draft: AgentDraft, existingId?: string) {
  const id = existingId ?? `${draft.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
  const agent: Agent = {
    id,
    name: draft.name,
    nameRu: draft.name,
    category: draft.category,
    status: 'ready',
    description: draft.systemPrompt.slice(0, 200),
    subAgents: draft.subAgents,
    dataSources: draft.tools,
    limitations: [],
    icon: draft.icon,
    color: draft.color,
  };
  const stored: Agent[] = JSON.parse(localStorage.getItem('rfv_custom_agents') ?? '[]');
  const idx = stored.findIndex(a => a.id === id);
  const updated = idx >= 0 ? stored.map((a, i) => (i === idx ? agent : a)) : [...stored, agent];
  localStorage.setItem('rfv_custom_agents', JSON.stringify(updated));
  return agent;
}

export default function AgentBuilder({ initialAgent, onGoToCatalog }: BuilderProps) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<AgentDraft>(initialAgent ? agentToDraft(initialAgent) : INITIAL);
  const [createdAgentId, setCreatedAgentId] = useState<string | null>(null);
  const [created, setCreated] = useState(false);
  const [creating, setCreating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Re-populate draft when initialAgent changes (navigating back to edit)
  useEffect(() => {
    if (initialAgent) {
      setDraft(agentToDraft(initialAgent));
      setCreatedAgentId(initialAgent.id);
      setStep(0);
      setCreated(false);
      setErrors({});
    }
  }, [initialAgent?.id]);

  const set = <K extends keyof AgentDraft>(k: K, v: AgentDraft[K]) =>
    setDraft(d => ({ ...d, [k]: v }));

  const toggleTool = (tool: string) =>
    set('tools', draft.tools.includes(tool)
      ? draft.tools.filter(t => t !== tool)
      : [...draft.tools, tool]
    );

  const validate = () => {
    const e: Record<string, string> = {};
    if (!draft.name.trim()) e.name = t.builder.errName;
    if (!draft.systemPrompt.trim()) e.prompt = t.builder.errPrompt;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    setCreating(true);
    await new Promise(r => setTimeout(r, 1200));
    const saved = persistCustomAgent(draft, createdAgentId ?? undefined);
    setCreatedAgentId(saved.id);
    setCreating(false);
    setCreated(true);
    toast(t.builder.created, 'success');
  };

  const handleExport = () => {
    const json = JSON.stringify({
      id: draft.name.toLowerCase().replace(/\s+/g, '-'),
      name: draft.name,
      category: draft.category,
      icon: draft.icon,
      color: draft.color,
      systemPrompt: draft.systemPrompt,
      tools: draft.tools,
      subAgents: draft.subAgents,
      version: '1.0',
    }, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${draft.name || 'agent'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => { setDraft(INITIAL); setStep(0); setCreated(false); setErrors({}); setCreatedAgentId(null); };

  const STEPS = [t.builder.step1, t.builder.step2, t.builder.step3];

  const previewStatus: AgentStatus = draft.tools.length > 0 ? 'ready' : 'idle';

  if (created) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="glass-panel p-10 max-w-sm w-full text-center space-y-6">
          <div className="flex justify-center">
            <AgentAvatar color={draft.color} icon={draft.icon} status="ready" size="lg" animate />
          </div>
          <div>
            <div className="text-2xl font-semibold text-text-primary mb-1">{draft.name}</div>
            <div className="text-sm text-text-muted">{t.builder.createdDesc}</div>
          </div>
          <div className="flex flex-col gap-2">
            {onGoToCatalog && (
              <button onClick={onGoToCatalog} className="btn-primary w-full flex items-center justify-center gap-2">
                ◈ Открыть в каталоге
              </button>
            )}
            <button onClick={handleExport} className="btn-ghost w-full flex items-center justify-center gap-2 border border-border-subtle">
              <span>↓</span> {t.builder.exportJson}
            </button>
            <button onClick={handleReset} className="btn-ghost w-full border border-border-subtle">
              {t.builder.reset}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left: form */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-xl font-semibold text-text-primary">{t.builder.title}</h1>
            <p className="text-sm text-text-muted mt-0.5">
              {initialAgent ? `Редактирование: ${initialAgent.name}` : t.builder.subtitle}
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-0">
            {STEPS.map((label, i) => (
              <div key={i} className="flex items-center">
                <button onClick={() => setStep(i)} className="flex items-center gap-2 group">
                  <StepDot n={i} current={step} />
                  <span className={`text-xs hidden sm:block transition-colors ${
                    i === step ? 'text-accent-blue' : 'text-text-muted'
                  }`}>{label}</span>
                </button>
                {i < STEPS.length - 1 && (
                  <div className={`h-px w-8 sm:w-16 mx-1 transition-colors ${i < step ? 'bg-accent-blue' : 'bg-border-subtle'}`} />
                )}
              </div>
            ))}
          </div>

          {/* ---- Step 0: Identity ---- */}
          {step === 0 && (
            <div className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-xs text-text-muted uppercase tracking-widest mb-2">{t.builder.nameLabel}</label>
                <input
                  value={draft.name}
                  onChange={e => { set('name', e.target.value); setErrors(er => ({ ...er, name: '' })); }}
                  placeholder={t.builder.namePlaceholder}
                  className={`w-full bg-bg-card border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder-text-muted outline-none focus:border-accent-blue transition-colors ${
                    errors.name ? 'border-signal-alert' : 'border-border-subtle'
                  }`}
                />
                {errors.name && <p className="text-xs text-signal-alert mt-1">{errors.name}</p>}
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs text-text-muted uppercase tracking-widest mb-2">{t.builder.categoryLabel}</label>
                <div className="flex gap-2">
                  {(['analytic', 'creative'] as AgentCategory[]).map(c => (
                    <button key={c} onClick={() => set('category', c)}
                      className={`flex-1 py-2.5 rounded-lg border text-sm transition-colors ${
                        draft.category === c
                          ? 'bg-accent-blue bg-opacity-15 text-accent-blue border-accent-blue border-opacity-40'
                          : 'bg-bg-card text-text-secondary border-border-subtle hover:text-text-primary'
                      }`}>
                      {c === 'analytic' ? t.builder.catAnalytic : t.builder.catCreative}
                    </button>
                  ))}
                </div>
              </div>

              {/* Icon picker */}
              <div>
                <label className="block text-xs text-text-muted uppercase tracking-widest mb-2">{t.builder.iconLabel}</label>
                <div className="flex flex-wrap gap-2">
                  {ICONS.map(ic => (
                    <button key={ic} onClick={() => set('icon', ic)}
                      className={`w-10 h-10 rounded-lg border text-lg transition-all ${
                        draft.icon === ic
                          ? 'border-accent-blue bg-accent-blue bg-opacity-15'
                          : 'border-border-subtle bg-bg-card hover:border-border-DEFAULT'
                      }`}
                      style={{ color: draft.color }}>
                      {ic}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color picker */}
              <div>
                <label className="block text-xs text-text-muted uppercase tracking-widest mb-2">{t.builder.colorLabel}</label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map(c => (
                    <button key={c} onClick={() => set('color', c)}
                      className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                        draft.color === c ? 'scale-125 border-white' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>

              <button onClick={() => setStep(1)} className="btn-primary w-full py-2.5">
                Далее →
              </button>
            </div>
          )}

          {/* ---- Step 1: System prompt ---- */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-xs text-text-muted uppercase tracking-widest mb-2">{t.builder.systemPrompt}</label>
                <textarea
                  value={draft.systemPrompt}
                  onChange={e => { set('systemPrompt', e.target.value); setErrors(er => ({ ...er, prompt: '' })); }}
                  placeholder={t.builder.promptPlaceholder}
                  rows={10}
                  className={`w-full bg-bg-card border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder-text-muted outline-none focus:border-accent-blue transition-colors resize-none font-mono leading-relaxed ${
                    errors.prompt ? 'border-signal-alert' : 'border-border-subtle'
                  }`}
                />
                {errors.prompt && <p className="text-xs text-signal-alert mt-1">{errors.prompt}</p>}
                <div className="flex justify-between mt-1 text-xs text-text-muted">
                  <span>{draft.systemPrompt.length} chars</span>
                  <span>≈ {Math.ceil(draft.systemPrompt.length / 4)} tokens</span>
                </div>
              </div>

              {/* Quick fill templates */}
              <div>
                <div className="text-xs text-text-muted mb-2">Шаблоны</div>
                <div className="space-y-1.5">
                  {[
                    'Вы — аналитический ИИ-агент. Анализируйте данные, выявляйте аномалии и формируйте структурированные отчёты с Chain-of-Thought.',
                    'Вы — творческий ИИ-агент. Создавайте визуальный контент, анимации и презентации по описаниям пользователя.',
                    'Вы — агент контроля качества. Детектируйте дефекты на производственных линиях, классифицируйте их и инициируйте протоколы исправления.',
                  ].map(tmpl => (
                    <button key={tmpl.slice(0, 20)} onClick={() => set('systemPrompt', tmpl)}
                      className="w-full text-left px-3 py-2 rounded-lg border border-border-subtle bg-bg-card hover:border-accent-blue transition-colors text-xs text-text-secondary">
                      <span className="text-accent-blue mr-2">→</span>{tmpl.slice(0, 80)}...
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setStep(0)} className="btn-ghost flex-1 border border-border-subtle py-2.5">← Назад</button>
                <button onClick={() => setStep(2)} className="btn-primary flex-1 py-2.5">Далее →</button>
              </div>
            </div>
          )}

          {/* ---- Step 2: Tools ---- */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-xs text-text-muted uppercase tracking-widest mb-3">{t.builder.toolsLabel}</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {TOOLS_LIST.map(tool => {
                    const active = draft.tools.includes(tool);
                    return (
                      <button key={tool} onClick={() => toggleTool(tool)}
                        className={`px-3 py-2.5 rounded-lg border text-xs font-mono transition-all text-left ${
                          active
                            ? 'bg-accent-blue bg-opacity-12 text-accent-blue border-accent-blue border-opacity-40'
                            : 'bg-bg-card text-text-secondary border-border-subtle hover:text-text-primary hover:border-border-DEFAULT'
                        }`}>
                        {active ? '✓ ' : '+ '}{tool}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sub-agents count */}
              <div>
                <label className="block text-xs text-text-muted uppercase tracking-widest mb-2">{t.builder.subAgentsLabel}</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => set('subAgents', Math.max(0, draft.subAgents - 1))}
                    className="w-8 h-8 rounded-lg border border-border-subtle bg-bg-card text-text-primary hover:bg-bg-hover transition-colors text-sm">−</button>
                  <span className="text-xl font-mono font-semibold text-text-primary w-8 text-center">{draft.subAgents}</span>
                  <button onClick={() => set('subAgents', Math.min(10, draft.subAgents + 1))}
                    className="w-8 h-8 rounded-lg border border-border-subtle bg-bg-card text-text-primary hover:bg-bg-hover transition-colors text-sm">+</button>
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setStep(1)} className="btn-ghost flex-1 border border-border-subtle py-2.5">← Назад</button>
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="btn-primary flex-1 py-2.5 flex items-center justify-center gap-2 disabled:opacity-60">
                  {creating && <span className="w-3.5 h-3.5 border-2 border-bg-primary border-t-transparent rounded-full animate-spin" />}
                  {creating ? t.builder.creating : (initialAgent ? 'Сохранить' : t.builder.create)}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: live preview */}
      <div className="w-72 xl:w-80 border-l border-border-subtle flex flex-col overflow-hidden shrink-0 bg-bg-secondary">
        <div className="px-5 py-4 border-b border-border-subtle">
          <span className="text-xs uppercase tracking-widest text-text-muted">{t.builder.preview}</span>
        </div>

        {/* Agent card preview */}
        <div className="p-5">
          <div className="glass-panel p-5 flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <AgentAvatar
                color={draft.color}
                icon={draft.icon}
                status={previewStatus}
                size="sm"
                animate={false}
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-text-primary truncate">
                  {draft.name || <span className="text-text-muted italic">Имя агента</span>}
                </div>
                <div className="text-xs text-text-muted mt-0.5">
                  {draft.category === 'analytic' ? t.builder.catAnalytic : t.builder.catCreative}
                </div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="status-dot" style={{ backgroundColor: draft.color }} />
                  <span className="text-xs text-text-muted">ready</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed line-clamp-3">
              {draft.systemPrompt || <span className="text-text-muted italic">Системный промпт появится здесь</span>}
            </p>
            {draft.tools.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {draft.tools.map(tool => (
                  <span key={tool} className="tag bg-bg-card border border-border-subtle text-text-muted text-xs font-mono">
                    {tool}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* JSON preview */}
        <div className="flex-1 overflow-y-auto px-5 pb-5">
          <div className="text-xs text-text-muted uppercase tracking-widest mb-2">JSON</div>
          <pre className="text-xs font-mono text-text-muted bg-bg-card rounded-lg p-3 overflow-x-auto leading-relaxed">
            {JSON.stringify({
              id: draft.name.toLowerCase().replace(/\s+/g, '-') || '...',
              name: draft.name || '...',
              category: draft.category,
              icon: draft.icon,
              color: draft.color,
              tools: draft.tools,
              subAgents: draft.subAgents,
            }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
