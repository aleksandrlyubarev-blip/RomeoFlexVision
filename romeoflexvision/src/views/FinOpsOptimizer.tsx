import { useState } from 'react';
import { useI18n } from '../context/I18nContext';
import { AGENTS } from '../data/agents';
import AgentAvatar from '../components/AgentAvatar';

// ---- Demo data (7-day window) ----
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface AgentSpend {
  agentId: string;
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  calls: number;
  costUsd: number;
  model: 'opus' | 'sonnet' | 'haiku';
}

const SPEND_DATA: AgentSpend[] = [
  { agentId: 'romeo-phd',       inputTokens: 48200, outputTokens: 31400, cachedTokens: 18600, calls: 142, costUsd: 4.82, model: 'opus'   },
  { agentId: 'robo-qc',         inputTokens: 38900, outputTokens: 12100, cachedTokens: 24300, calls: 318, costUsd: 2.14, model: 'sonnet' },
  { agentId: 'andrew-analytic', inputTokens: 29700, outputTokens: 18400, cachedTokens: 11200, calls: 207, costUsd: 1.87, model: 'sonnet' },
  { agentId: 'bassito-animator',inputTokens: 14200, outputTokens: 22100, cachedTokens: 2800,  calls: 54,  costUsd: 2.31, model: 'opus'   },
  { agentId: 'perevodchik',     inputTokens: 9800,  outputTokens: 11200, cachedTokens: 5600,  calls: 89,  costUsd: 0.61, model: 'haiku'  },
  { agentId: 'chertejnik',      inputTokens: 3200,  outputTokens: 4100,  cachedTokens: 400,   calls: 12,  costUsd: 0.38, model: 'haiku'  },
];

const TOTAL_COST   = SPEND_DATA.reduce((s, d) => s + d.costUsd, 0);
const TOTAL_INPUT  = SPEND_DATA.reduce((s, d) => s + d.inputTokens, 0);
const TOTAL_OUTPUT = SPEND_DATA.reduce((s, d) => s + d.outputTokens, 0);
const TOTAL_CACHED = SPEND_DATA.reduce((s, d) => s + d.cachedTokens, 0);
const TOTAL_TOKENS = TOTAL_INPUT + TOTAL_OUTPUT + TOTAL_CACHED;
const CACHE_HIT    = Math.round(TOTAL_CACHED / TOTAL_TOKENS * 100);

// Daily spend for bar chart (simulated)
const DAILY_SPEND = [1.82, 2.44, 1.61, 2.08, 2.91, 0.94, 0.33];

// ---- Recommendations ----
interface Rec {
  id: string;
  impact: 'high' | 'medium' | 'low';
  agentId: string;
  title: string;
  desc: string;
  savingUsd: number;
  savingPct: number;
  action: string;
}

const RECS: Rec[] = [
  {
    id: 'r1', impact: 'high', agentId: 'romeo-phd',
    title: 'Переключить Romeo PhD → Sonnet 4.5',
    desc: 'Opus используется для генерации отчётов средней сложности. Sonnet 4.5 справляется с этим классом задач с качеством 97% при стоимости в 5× ниже.',
    savingUsd: 3.62, savingPct: 75, action: 'Применить маршрутизацию',
  },
  {
    id: 'r2', impact: 'high', agentId: 'bassito-animator',
    title: 'Переключить Bassito → Sonnet для простых задач',
    desc: 'Opus задействован на анимациях с шаблонными параметрами. Auto-routing сохранит Opus только для нестандартных запросов (≈20% задач).',
    savingUsd: 1.69, savingPct: 73, action: 'Настроить авто-маршрутизацию',
  },
  {
    id: 'r3', impact: 'medium', agentId: 'robo-qc',
    title: 'Расширить кэш Robo QC до 60%',
    desc: 'Текущий cache hit rate: 38%. Добавление системного промпта к prefix cache увеличит hit rate до ~58%, экономия ≈$0.42/день.',
    savingUsd: 0.42, savingPct: 20, action: 'Включить extended cache',
  },
  {
    id: 'r4', impact: 'low', agentId: 'andrew-analytic',
    title: 'Пакетные запросы Andrew Analytic',
    desc: 'Andrew выполняет 207 отдельных запросов к ClickHouse. Группировка в batch-запросы сократит calls на 60% и задержку на 40%.',
    savingUsd: 0.28, savingPct: 15, action: 'Включить батчинг',
  },
];

const IMPACT_COLOR = { high: '#f7768e', medium: '#e0af68', low: '#73daca' };
const IMPACT_LABEL = { high: 'Высокий', medium: 'Средний', low: 'Низкий' };
const MODEL_COLOR  = { opus: '#9d7cd8', sonnet: '#7aa2f7', haiku: '#73daca' };

// ---- Projected savings ----
function SavingsProjection({ applied }: { applied: Set<string> }) {
  const saved = RECS.filter(r => applied.has(r.id)).reduce((s, r) => s + r.savingUsd, 0);
  const newCost = TOTAL_COST - saved;
  const pct = Math.round(saved / TOTAL_COST * 100);
  return (
    <div className="glass-panel p-5 space-y-3">
      <div className="text-xs uppercase tracking-widest text-text-muted">Прогноз сбережений</div>
      <div className="flex gap-6">
        <div>
          <div className="text-xs text-text-muted mb-0.5">Текущие затраты/нед</div>
          <div className="text-xl font-mono font-semibold text-text-primary">${TOTAL_COST.toFixed(2)}</div>
        </div>
        <div className="text-2xl text-text-muted self-center">→</div>
        <div>
          <div className="text-xs text-text-muted mb-0.5">После оптимизации</div>
          <div className={`text-xl font-mono font-semibold ${saved > 0 ? 'text-accent-cyan' : 'text-text-primary'}`}>
            ${newCost.toFixed(2)}
          </div>
        </div>
        {saved > 0 && (
          <div className="ml-auto text-right">
            <div className="text-xs text-text-muted mb-0.5">Экономия</div>
            <div className="text-xl font-mono font-semibold text-signal-success">−${saved.toFixed(2)}</div>
            <div className="text-xs text-accent-cyan">−{pct}% / нед</div>
          </div>
        )}
      </div>
      {/* Month projection */}
      {saved > 0 && (
        <div className="text-xs text-text-muted pt-1 border-t border-border-subtle">
          Экономия в месяц: <span className="text-accent-cyan font-mono font-semibold">${(saved * 4.3).toFixed(2)}</span>
          {' · '}в год: <span className="text-accent-cyan font-mono font-semibold">${(saved * 52).toFixed(2)}</span>
        </div>
      )}
    </div>
  );
}

// ---- Bar chart (spend) ----
function SpendChart() {
  const max = Math.max(...DAILY_SPEND);
  return (
    <div className="glass-panel p-5">
      <div className="text-xs uppercase tracking-widest text-text-muted mb-4">Затраты по дням (USD)</div>
      <div className="flex items-end gap-2 h-24">
        {DAILY_SPEND.map((v, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="text-xs font-mono text-text-muted">${v.toFixed(2)}</div>
            <div className="w-full rounded-t"
              style={{ height: `${(v / max) * 64}px`, backgroundColor: '#7aa2f760' }} />
            <div className="text-xs text-text-muted">{DAYS[i]}</div>
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-3 text-xs text-text-muted">
        <span>Total 7d: <span className="text-text-primary font-mono">${TOTAL_COST.toFixed(2)}</span></span>
        <span>Avg/day: <span className="text-text-primary font-mono">${(TOTAL_COST / 7).toFixed(2)}</span></span>
      </div>
    </div>
  );
}

// ---- Main ----
export default function FinOpsOptimizer() {
  useI18n();
  const [applied, setApplied] = useState<Set<string>>(new Set());
  const [analysing, setAnalysing] = useState(false);
  const [analysed, setAnalysed] = useState(true);

  const toggleApply = (id: string) =>
    setApplied(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const handleAnalyse = async () => {
    setAnalysing(true);
    await new Promise(r => setTimeout(r, 1800));
    setAnalysing(false);
    setAnalysed(true);
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-6 lg:px-8 py-6 space-y-6 max-w-5xl">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-xl font-semibold text-text-primary">FinOps Optimizer</h1>
            <p className="text-sm text-text-muted mt-0.5">Анализ затрат на LLM и авто-рекомендации · последние 7 дней</p>
          </div>
          <button onClick={handleAnalyse} disabled={analysing}
            className="ml-auto btn-primary text-xs px-5 py-2 flex items-center gap-2 disabled:opacity-60">
            {analysing && <span className="w-3 h-3 border-2 border-bg-primary border-t-transparent rounded-full animate-spin" />}
            {analysing ? 'Анализирую...' : '↻ Обновить анализ'}
          </button>
        </div>

        {/* Top metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Затраты (7д)', value: `$${TOTAL_COST.toFixed(2)}`, accent: 'text-text-primary' },
            { label: 'Cache Hit Rate', value: `${CACHE_HIT}%`, accent: 'text-accent-cyan' },
            { label: 'Всего токенов', value: `${(TOTAL_TOKENS / 1000).toFixed(0)}K`, accent: 'text-accent-blue' },
            { label: 'Вызовов агентов', value: String(SPEND_DATA.reduce((s, d) => s + d.calls, 0)), accent: 'text-text-primary' },
          ].map(m => (
            <div key={m.label} className="glass-panel p-4">
              <div className="text-xs text-text-muted uppercase tracking-widest mb-1.5">{m.label}</div>
              <div className={`text-2xl font-mono font-semibold ${m.accent}`}>{m.value}</div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Spend chart */}
          <SpendChart />

          {/* Agent breakdown */}
          <div className="glass-panel p-5">
            <div className="text-xs uppercase tracking-widest text-text-muted mb-4">Затраты по агентам</div>
            <div className="space-y-3">
              {SPEND_DATA.sort((a, b) => b.costUsd - a.costUsd).map(d => {
                const agent = AGENTS.find(a => a.id === d.agentId);
                const pct = d.costUsd / TOTAL_COST * 100;
                return (
                  <div key={d.agentId}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {agent && <AgentAvatar color={agent.color} icon={agent.icon} status={agent.status} size="sm" animate={false} agentId={agent.id} />}
                        <span className="text-xs text-text-secondary">{agent?.name}</span>
                        <span className="tag text-xs font-mono border-0 px-1 py-0" style={{ color: MODEL_COLOR[d.model], backgroundColor: `${MODEL_COLOR[d.model]}15` }}>
                          {d.model}
                        </span>
                      </div>
                      <span className="text-xs font-mono text-text-primary">${d.costUsd.toFixed(2)}</span>
                    </div>
                    <div className="h-1.5 bg-bg-card rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: agent?.color ?? '#7aa2f7' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Savings projection */}
        <SavingsProjection applied={applied} />

        {/* Recommendations */}
        {analysed && (
          <div>
            <div className="text-xs uppercase tracking-widest text-text-muted mb-3">
              Рекомендации оптимизатора · {RECS.length} найдено
            </div>
            <div className="space-y-3">
              {RECS.map(rec => {
                const agent = AGENTS.find(a => a.id === rec.agentId);
                const isApplied = applied.has(rec.id);
                return (
                  <div key={rec.id} className={`glass-panel p-5 transition-all duration-200 ${
                    isApplied ? 'border-accent-cyan border-opacity-50 bg-accent-cyan bg-opacity-3' : ''
                  }`}>
                    <div className="flex items-start gap-4">
                      <div>
                        <div className="text-xs font-medium px-2 py-0.5 rounded-full border"
                          style={{ color: IMPACT_COLOR[rec.impact], borderColor: `${IMPACT_COLOR[rec.impact]}40`, backgroundColor: `${IMPACT_COLOR[rec.impact]}10` }}>
                          {IMPACT_LABEL[rec.impact]}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          {agent && <AgentAvatar color={agent.color} icon={agent.icon} status={agent.status} size="sm" animate={false} agentId={agent.id} />}
                          <div className="text-sm font-medium text-text-primary">{rec.title}</div>
                        </div>
                        <p className="text-xs text-text-secondary leading-relaxed mb-3">{rec.desc}</p>
                        <div className="flex items-center gap-4">
                          <div className="text-xs text-accent-cyan font-mono">
                            −${rec.savingUsd.toFixed(2)}/нед (−{rec.savingPct}%)
                          </div>
                          <button
                            onClick={() => toggleApply(rec.id)}
                            className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                              isApplied
                                ? 'bg-accent-cyan bg-opacity-15 text-accent-cyan border-accent-cyan border-opacity-40'
                                : 'bg-bg-card text-text-secondary border-border-subtle hover:text-accent-blue hover:border-accent-blue'
                            }`}>
                            {isApplied ? '✓ Применено' : rec.action}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
