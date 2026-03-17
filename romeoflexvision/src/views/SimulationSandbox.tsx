import { useState } from 'react';
import AgentAvatar from '../components/AgentAvatar';
import { AGENTS } from '../data/agents';

// ---- Scenario library (historical tasks) ----
interface Scenario {
  id: string;
  title: string;
  originalPrompt: string;
  timestamp: string;
  agentId: string;
  originalTokens: number;
  originalLatencyMs: number;
  originalCostUsd: number;
  originalResult: string;
  originalModel: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: 's1',
    title: 'Анализ дефекта линии A3',
    originalPrompt: 'Проанализировать производственный дефект на линии A3, создать отчёт',
    timestamp: '2025-03-14 14:32',
    agentId: 'robo-qc',
    originalTokens: 581,
    originalLatencyMs: 2340,
    originalCostUsd: 0.089,
    originalModel: 'claude-opus-4-6',
    originalResult: 'Обнаружены 3 дефекта типа "поверхностная царапина" класса B по ISO 1302. Confidence: 94.2%. Рекомендуется осмотр позиций 140–144 линии A3.',
  },
  {
    id: 's2',
    title: 'Технический перевод ГОСТ 2.307',
    originalPrompt: 'Перевести ГОСТ 2.307-2011 разделы 3–5 на английский язык с сохранением технической терминологии',
    timestamp: '2025-03-13 10:15',
    agentId: 'perevodchik',
    originalTokens: 4820,
    originalLatencyMs: 8100,
    originalCostUsd: 0.341,
    originalModel: 'claude-opus-4-6',
    originalResult: 'Translated: GOST 2.307-2011 Sections 3–5 "Indication of Dimensions and Deviations on Technical Drawings". Terminology aligned with ISO 129-1:2018. 847 words translated, 12 technical terms footnoted.',
  },
  {
    id: 's3',
    title: 'Прогноз ТО станка #7',
    originalPrompt: 'Построить прогноз технического обслуживания для станка #7 на основе данных вибрации за 90 дней',
    timestamp: '2025-03-12 09:44',
    agentId: 'andrew-analytic',
    originalTokens: 12400,
    originalLatencyMs: 6800,
    originalCostUsd: 0.512,
    originalModel: 'claude-sonnet-4-6',
    originalResult: 'Прогноз: вероятность отказа подшипника в течение 72 часов — 78%. Аномалия зафиксирована на частоте 143 Гц. Рекомендуется замена подшипника SKF 6205 до 18.03.2025.',
  },
];

const ALT_MODELS = [
  { id: 'claude-opus-4-6',   label: 'Claude Opus 4.6',    costMultiplier: 1.0,  qualityPct: 100 },
  { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6',  costMultiplier: 0.2,  qualityPct: 97  },
  { id: 'claude-haiku-4-5',  label: 'Claude Haiku 4.5',   costMultiplier: 0.04, qualityPct: 88  },
];

// Simulated result for re-run
function simulateResult(scenario: Scenario, model: string, agentId: string): string {
  if (model === 'claude-haiku-4-5') {
    return `[Haiku] ${scenario.originalResult.slice(0, 120)}... (сокращённый анализ, точность снижена до 88%)`;
  }
  if (agentId !== scenario.agentId) {
    const agent = AGENTS.find(a => a.id === agentId);
    return `[${agent?.name}] Альтернативный анализ: ${scenario.originalResult.slice(0, 160)}... Подход отличается от оригинального агента.`;
  }
  return `[${model.includes('sonnet') ? 'Sonnet' : 'Opus'}] ${scenario.originalResult} (качество 97%)`;
}

type RunStatus = 'idle' | 'running' | 'done';

interface RunResult {
  tokens: number;
  latencyMs: number;
  costUsd: number;
  result: string;
  model: string;
  agentId: string;
}

export default function SimulationSandbox() {
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [altModel, setAltModel] = useState('claude-sonnet-4-6');
  const [altAgent, setAltAgent] = useState('');
  const [runStatus, setRunStatus] = useState<RunStatus>('idle');
  const [runResult, setRunResult] = useState<RunResult | null>(null);

  const handleRun = async () => {
    if (!selectedScenario) return;
    setRunStatus('running');
    setRunResult(null);
    const model = altModel;
    const agentId = altAgent || selectedScenario.agentId;
    const mult = ALT_MODELS.find(m => m.id === model)?.costMultiplier ?? 1;

    await new Promise(r => setTimeout(r, 1400 + Math.random() * 800));

    setRunResult({
      tokens: Math.round(selectedScenario.originalTokens * (0.85 + Math.random() * 0.3)),
      latencyMs: Math.round(selectedScenario.originalLatencyMs * (mult === 0.04 ? 0.4 : mult === 0.2 ? 0.7 : 1.1)),
      costUsd: +(selectedScenario.originalCostUsd * mult * (0.9 + Math.random() * 0.2)).toFixed(4),
      result: simulateResult(selectedScenario, model, agentId),
      model,
      agentId,
    });
    setRunStatus('done');
  };

  const handleSelect = (s: Scenario) => {
    setSelectedScenario(s);
    setAltAgent(s.agentId);
    setRunStatus('idle');
    setRunResult(null);
  };

  const origAgent = selectedScenario ? AGENTS.find(a => a.id === selectedScenario.agentId) : null;
  const newAgent  = altAgent ? AGENTS.find(a => a.id === altAgent) : origAgent;

  // Delta calculations
  const delta = runResult && selectedScenario ? {
    tokens:  runResult.tokens - selectedScenario.originalTokens,
    latency: runResult.latencyMs - selectedScenario.originalLatencyMs,
    cost:    runResult.costUsd - selectedScenario.originalCostUsd,
  } : null;

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left: scenario list */}
      <div className="w-72 border-r border-border-subtle flex flex-col overflow-hidden shrink-0 bg-bg-secondary">
        <div className="px-4 py-4 border-b border-border-subtle">
          <h2 className="text-base font-semibold text-text-primary">Simulation Sandbox</h2>
          <p className="text-xs text-text-muted mt-0.5">Replay задачи с другой моделью или агентом</p>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {SCENARIOS.map(s => {
            const agent = AGENTS.find(a => a.id === s.agentId);
            const isActive = selectedScenario?.id === s.id;
            return (
              <button key={s.id} onClick={() => handleSelect(s)}
                className={`w-full text-left glass-panel p-3 transition-all ${
                  isActive ? 'border-accent-blue border-opacity-60 bg-accent-blue bg-opacity-5' : 'hover:border-border-DEFAULT'
                }`}>
                <div className="flex items-center gap-2 mb-1.5">
                  {agent && <AgentAvatar color={agent.color} icon={agent.icon} status={agent.status} size="sm" animate={false} agentId={agent.id} />}
                  <div className="text-xs font-medium text-text-primary truncate">{s.title}</div>
                </div>
                <div className="text-xs text-text-muted">{s.timestamp}</div>
                <div className="flex gap-2 mt-1.5 text-xs font-mono">
                  <span className="text-text-muted">{s.originalTokens}t</span>
                  <span className="text-text-muted">{(s.originalLatencyMs / 1000).toFixed(1)}s</span>
                  <span className="text-text-muted">${s.originalCostUsd}</span>
                </div>
              </button>
            );
          })}
        </div>
        <div className="p-3 border-t border-border-subtle text-xs text-text-muted text-center">
          {SCENARIOS.length} исторических сценариев
        </div>
      </div>

      {/* Right: replay config + results */}
      <div className="flex-1 overflow-y-auto">
        {!selectedScenario ? (
          <div className="flex-1 flex items-center justify-center h-full text-center p-8">
            <div>
              <div className="text-4xl opacity-20 mb-3">◁▷</div>
              <div className="text-sm font-medium text-text-secondary">Выберите сценарий слева</div>
              <div className="text-xs text-text-muted mt-1">Затем настройте параметры и запустите симуляцию</div>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-6 max-w-3xl">
            {/* Scenario header */}
            <div className="glass-panel p-5">
              <div className="text-xs uppercase tracking-widest text-text-muted mb-2">Оригинальная задача · {selectedScenario.timestamp}</div>
              <p className="text-sm text-text-primary font-medium mb-3">{selectedScenario.originalPrompt}</p>
              <div className="flex gap-4 text-xs font-mono text-text-muted">
                <span>Модель: <span className="text-text-secondary">{selectedScenario.originalModel}</span></span>
                <span>Агент: <span className="text-text-secondary">{origAgent?.name}</span></span>
                <span>Токены: <span className="text-text-secondary">{selectedScenario.originalTokens}</span></span>
                <span>Стоимость: <span className="text-signal-warning">${selectedScenario.originalCostUsd}</span></span>
              </div>
            </div>

            {/* Config */}
            <div className="glass-panel p-5 space-y-5">
              <div className="text-xs uppercase tracking-widest text-text-muted">Параметры симуляции</div>

              {/* Model selector */}
              <div>
                <label className="block text-xs text-text-muted mb-2">Модель</label>
                <div className="grid grid-cols-3 gap-2">
                  {ALT_MODELS.map(m => (
                    <button key={m.id} onClick={() => setAltModel(m.id)}
                      className={`px-3 py-2.5 rounded-lg border text-xs transition-colors text-left ${
                        altModel === m.id
                          ? 'bg-accent-blue bg-opacity-15 text-accent-blue border-accent-blue border-opacity-40'
                          : 'bg-bg-card text-text-secondary border-border-subtle hover:text-text-primary'
                      }`}>
                      <div className="font-medium">{m.label.split(' ').slice(-1)[0]}</div>
                      <div className="text-text-muted mt-0.5">×{m.costMultiplier} · {m.qualityPct}%</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Agent selector */}
              <div>
                <label className="block text-xs text-text-muted mb-2">Агент</label>
                <div className="flex flex-wrap gap-2">
                  {AGENTS.filter(a => a.id !== 'orchestrator').map(a => (
                    <button key={a.id} onClick={() => setAltAgent(a.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition-colors ${
                        altAgent === a.id
                          ? 'border-opacity-60 text-text-primary'
                          : 'bg-bg-card text-text-muted border-border-subtle hover:text-text-primary'
                      }`}
                      style={altAgent === a.id ? { borderColor: a.color, backgroundColor: `${a.color}15` } : {}}>
                      <span style={{ color: a.color }}>{a.icon}</span>
                      {a.name}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={handleRun} disabled={runStatus === 'running'}
                className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 disabled:opacity-60">
                {runStatus === 'running' && (
                  <span className="w-3.5 h-3.5 border-2 border-bg-primary border-t-transparent rounded-full animate-spin" />
                )}
                {runStatus === 'running' ? 'Запускаю симуляцию...' : '▶ Запустить симуляцию'}
              </button>
            </div>

            {/* Results — side by side */}
            {runResult && delta && (
              <div className="space-y-4">
                <div className="text-xs uppercase tracking-widest text-text-muted">Сравнение результатов</div>

                {/* Delta metrics */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Токены', orig: selectedScenario.originalTokens, sim: runResult.tokens, delta: delta.tokens, unit: '' },
                    { label: 'Задержка', orig: `${(selectedScenario.originalLatencyMs/1000).toFixed(1)}s`, sim: `${(runResult.latencyMs/1000).toFixed(1)}s`, delta: delta.latency, unit: 'ms' },
                    { label: 'Стоимость', orig: `$${selectedScenario.originalCostUsd}`, sim: `$${runResult.costUsd}`, delta: delta.cost, unit: '$' },
                  ].map(m => (
                    <div key={m.label} className="glass-panel p-4 text-center">
                      <div className="text-xs text-text-muted uppercase tracking-widest mb-2">{m.label}</div>
                      <div className="flex items-center justify-center gap-2 text-sm font-mono">
                        <span className="text-text-muted">{m.orig}</span>
                        <span className="text-text-muted text-xs">→</span>
                        <span className="text-text-primary font-semibold">{m.sim}</span>
                      </div>
                      {typeof m.delta === 'number' && (
                        <div className={`text-xs font-mono mt-1 ${m.delta < 0 ? 'text-accent-cyan' : m.delta > 0 ? 'text-signal-warning' : 'text-text-muted'}`}>
                          {m.delta > 0 ? '+' : ''}{m.unit === '$' ? `$${m.delta.toFixed(4)}` : m.unit === 'ms' ? `${m.delta}ms` : m.delta}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Result comparison */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="glass-panel p-4">
                    <div className="flex items-center gap-2 mb-3">
                      {origAgent && <AgentAvatar color={origAgent.color} icon={origAgent.icon} status={origAgent.status} size="sm" animate={false} agentId={origAgent.id} />}
                      <span className="text-xs font-medium text-text-muted">Оригинал · {selectedScenario.originalModel.split('-').slice(1, 3).join(' ')}</span>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed">{selectedScenario.originalResult}</p>
                  </div>
                  <div className="glass-panel p-4 border-accent-blue border-opacity-30">
                    <div className="flex items-center gap-2 mb-3">
                      {newAgent && <AgentAvatar color={newAgent.color} icon={newAgent.icon} status={newAgent.status} size="sm" animate={false} agentId={newAgent.id} />}
                      <span className="text-xs font-medium text-accent-blue">Симуляция · {altModel.split('-').slice(1, 3).join(' ')}</span>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed">{runResult.result}</p>
                  </div>
                </div>

                {/* Verdict */}
                <div className={`glass-panel p-4 text-sm ${delta.cost < 0 ? 'border-accent-cyan border-opacity-40' : 'border-signal-warning border-opacity-30'}`}>
                  {delta.cost < 0
                    ? `✓ Симуляция дешевле на $${Math.abs(delta.cost).toFixed(4)} (${Math.round(Math.abs(delta.cost) / selectedScenario.originalCostUsd * 100)}%). Рекомендуется применить настройки.`
                    : `△ Симуляция дороже на $${delta.cost.toFixed(4)}. Оригинальные настройки оптимальны.`
                  }
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
