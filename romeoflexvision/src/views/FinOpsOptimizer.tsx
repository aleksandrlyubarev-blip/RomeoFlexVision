import { useState } from 'react';
import { useMetrics } from '../hooks/useMetrics';
import { AGENTS } from '../data/agents';
import AgentAvatar from '../components/AgentAvatar';

// ---- Model color map ----
const MODEL_COLOR: Record<string, string> = { opus: '#9d7cd8', sonnet: '#7aa2f7', haiku: '#73daca' };

// ---- Recommendations (business rules — static) ----
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
    desc: 'Andrew выполняет много отдельных запросов к ClickHouse. Группировка в batch-запросы сократит calls на 60% и задержку на 40%.',
    savingUsd: 0.28, savingPct: 15, action: 'Включить батчинг',
  },
];

const IMPACT_COLOR = { high: '#f7768e', medium: '#e0af68', low: '#73daca' };
const IMPACT_LABEL = { high: 'Высокий', medium: 'Средний', low: 'Низкий' };

// ---- DAYS for bar chart ----
const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

// ---- Spend chart ----
function SpendChart({ daily30d }: { daily30d: { cost: number; label: string }[] }) {
  const last7 = daily30d.slice(-7);
  const max = Math.max(...last7.map(d => d.cost));
  return (
    <div className="glass-panel p-5">
      <div className="text-xs uppercase tracking-widest text-text-muted mb-4">Затраты по дням (USD)</div>
      <div className="flex items-end gap-2 h-24">
        {last7.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="text-xs font-mono text-text-muted">${d.cost.toFixed(2)}</div>
            <div className="w-full rounded-t transition-all duration-300"
              style={{ height: `${Math.max(4, (d.cost / max) * 64)}px`, backgroundColor: '#7aa2f760' }} />
            <div className="text-xs text-text-muted">{DAYS[i]}</div>
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-3 text-xs text-text-muted">
        <span>Total 7d: <span className="text-text-primary font-mono">
          ${last7.reduce((s, d) => s + d.cost, 0).toFixed(2)}
        </span></span>
        <span>Avg/day: <span className="text-text-primary font-mono">
          ${(last7.reduce((s, d) => s + d.cost, 0) / 7).toFixed(2)}
        </span></span>
      </div>
    </div>
  );
}

// ---- Savings projection ----
function SavingsProjection({ applied, totalCost }: { applied: Set<string>; totalCost: number }) {
  const saved   = RECS.filter(r => applied.has(r.id)).reduce((s, r) => s + r.savingUsd, 0);
  const newCost = totalCost - saved;
  const pct     = Math.round(saved / totalCost * 100);

  return (
    <div className="glass-panel p-5 space-y-3">
      <div className="text-xs uppercase tracking-widest text-text-muted">Прогноз сбережений</div>
      <div className="flex gap-6 flex-wrap">
        <div>
          <div className="text-xs text-text-muted mb-0.5">Текущие затраты/нед</div>
          <div className="text-xl font-mono font-semibold text-text-primary">${totalCost.toFixed(2)}</div>
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
      {saved > 0 && (
        <div className="text-xs text-text-muted pt-2 border-t border-border-subtle">
          Экономия в месяц:{' '}
          <span className="text-accent-cyan font-mono font-semibold">${(saved * 4.3).toFixed(2)}</span>
          {' · '}в год:{' '}
          <span className="text-accent-cyan font-mono font-semibold">${(saved * 52).toFixed(2)}</span>
        </div>
      )}
    </div>
  );
}

// ---- Main ----
export default function FinOpsOptimizer() {
  const {
    agentSpend,
    daily30d,
    totalCost,
    totalCached,
    totalTokens,
    totalCalls,
    cacheHitRate,
    appliedRecs,
    toggleRec,
  } = useMetrics();

  const [analysing, setAnalysing] = useState(false);
  const [analysed,  setAnalysed]  = useState(true);

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
        <div className="flex items-center gap-4 flex-wrap">
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

        {/* Top metrics — same numbers as Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Затраты (7д)',      value: `$${totalCost.toFixed(2)}`,                accent: 'text-text-primary' },
            { label: 'Cache Hit Rate',    value: `${cacheHitRate.toFixed(1)}%`,             accent: 'text-accent-cyan'  },
            { label: 'Всего токенов',     value: `${(totalTokens / 1000).toFixed(0)}K`,     accent: 'text-accent-blue'  },
            { label: 'Вызовов агентов',   value: String(totalCalls),                        accent: 'text-text-primary' },
          ].map(m => (
            <div key={m.label} className="glass-panel p-4">
              <div className="text-xs text-text-muted uppercase tracking-widest mb-1.5">{m.label}</div>
              <div className={`text-2xl font-mono font-semibold ${m.accent}`}>{m.value}</div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Spend bar chart */}
          <SpendChart daily30d={daily30d} />

          {/* Agent breakdown */}
          <div className="glass-panel p-5">
            <div className="text-xs uppercase tracking-widest text-text-muted mb-4">Затраты по агентам</div>
            <div className="space-y-3">
              {agentSpend.slice().sort((a, b) => b.costUsd - a.costUsd).map(d => {
                const agent = AGENTS.find(a => a.id === d.agentId);
                const pct   = d.costUsd / totalCost * 100;
                return (
                  <div key={d.agentId}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {agent && (
                          <AgentAvatar color={agent.color} icon={agent.icon} status={agent.status}
                            size="sm" animate={false} agentId={agent.id} />
                        )}
                        <span className="text-xs text-text-secondary">{agent?.name ?? d.agentId}</span>
                        <span className="tag text-xs font-mono border-0 px-1 py-0"
                          style={{ color: MODEL_COLOR[d.model], backgroundColor: `${MODEL_COLOR[d.model]}15` }}>
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
            {/* Cache savings callout */}
            <div className="mt-4 px-3 py-2.5 rounded-lg bg-accent-cyan bg-opacity-5 border border-accent-cyan border-opacity-20 text-xs text-text-secondary">
              Кэш сэкономил: <span className="text-accent-cyan font-mono font-semibold">
                ${((totalCached / 1_000_000) * 1.5 * 0.9).toFixed(2)}
              </span> за 7 дней
            </div>
          </div>
        </div>

        {/* Savings projection */}
        <SavingsProjection applied={appliedRecs} totalCost={totalCost} />

        {/* Recommendations */}
        {analysed && (
          <div>
            <div className="text-xs uppercase tracking-widest text-text-muted mb-3">
              Рекомендации оптимизатора · {RECS.length} найдено
              {appliedRecs.size > 0 && (
                <span className="ml-2 text-accent-cyan">· {appliedRecs.size} применено</span>
              )}
            </div>
            <div className="space-y-3">
              {RECS.map(rec => {
                const agent     = AGENTS.find(a => a.id === rec.agentId);
                const isApplied = appliedRecs.has(rec.id);
                return (
                  <div key={rec.id} className={`glass-panel p-5 transition-all duration-200 ${
                    isApplied ? 'border-accent-cyan border-opacity-50 bg-accent-cyan bg-opacity-[0.03]' : ''
                  }`}>
                    <div className="flex items-start gap-4">
                      <div className="shrink-0">
                        <div className="text-xs font-medium px-2 py-0.5 rounded-full border"
                          style={{
                            color: IMPACT_COLOR[rec.impact],
                            borderColor: `${IMPACT_COLOR[rec.impact]}40`,
                            backgroundColor: `${IMPACT_COLOR[rec.impact]}10`,
                          }}>
                          {IMPACT_LABEL[rec.impact]}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          {agent && (
                            <AgentAvatar color={agent.color} icon={agent.icon} status={agent.status}
                              size="sm" animate={false} agentId={agent.id} />
                          )}
                          <div className="text-sm font-medium text-text-primary">{rec.title}</div>
                        </div>
                        <p className="text-xs text-text-secondary leading-relaxed mb-3">{rec.desc}</p>
                        <div className="flex items-center gap-4 flex-wrap">
                          <div className="text-xs text-accent-cyan font-mono">
                            −${rec.savingUsd.toFixed(2)}/нед (−{rec.savingPct}%)
                          </div>
                          <button
                            onClick={() => toggleRec(rec.id)}
                            className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                              isApplied
                                ? 'bg-accent-cyan bg-opacity-15 text-accent-cyan border-accent-cyan border-opacity-40'
                                : 'bg-bg-card text-text-secondary border-border-subtle hover:text-accent-blue hover:border-accent-blue'
                            }`}>
                            {isApplied ? '✓ Применено' : rec.action}
                          </button>
                          {isApplied && (
                            <span className="text-xs text-text-muted">сохранено</span>
                          )}
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
