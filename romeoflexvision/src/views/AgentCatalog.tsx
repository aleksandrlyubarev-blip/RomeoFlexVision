import { useState } from 'react';
import AgentAvatar, { STATUS_LABELS, STATUS_COLORS } from '../components/AgentAvatar';
import { AGENTS } from '../data/agents';
import type { Agent, AgentCategory } from '../types';

const CATEGORY_LABELS: Record<AgentCategory, string> = {
  analytic: 'Аналитические',
  creative: 'Творческие',
  orchestrator: 'Оркестратор',
};

interface AgentDetailProps {
  agent: Agent;
  onClose: () => void;
}

function AgentDetail({ agent, onClose }: AgentDetailProps) {
  const [tab, setTab] = useState<'overview' | 'explainability'>('overview');
  const statusColor = STATUS_COLORS[agent.status];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-end md:items-center justify-center z-50 p-0 md:p-6"
      onClick={onClose}>
      <div className="glass-panel w-full md:max-w-xl md:rounded-xl rounded-t-2xl p-6 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <AgentAvatar color={agent.color} icon={agent.icon} status={agent.status} size="md" />
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-text-primary">{agent.name}</h2>
            <div className="text-sm text-text-muted">{agent.nameRu}</div>
            <div className="flex items-center gap-2 mt-2">
              <span className="status-dot" style={{ backgroundColor: statusColor }} />
              <span className="text-xs" style={{ color: statusColor }}>{STATUS_LABELS[agent.status]}</span>
              <span className="tag bg-bg-card text-text-muted border border-border-subtle ml-1">
                {CATEGORY_LABELS[agent.category]}
              </span>
              {agent.subAgents > 0 && (
                <span className="text-xs text-text-muted">{agent.subAgents} субагентов</span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary p-1">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 border-b border-border-subtle pb-0">
          {(['overview', 'explainability'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-2 text-sm transition-colors border-b-2 -mb-px ${
                tab === t ? 'border-accent-blue text-accent-blue' : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}>
              {t === 'overview' ? 'Обзор' : 'Объяснимость'}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div className="space-y-4">
            <p className="text-sm text-text-secondary leading-relaxed">{agent.description}</p>
            <div className="flex gap-2 flex-wrap">
              <button className="btn-primary text-xs py-1.5 px-3">Тестировать</button>
              <button className="btn-ghost text-xs py-1.5 px-3 border border-border-subtle">Дублировать</button>
              <button className="btn-ghost text-xs py-1.5 px-3 border border-border-subtle">Редактировать</button>
            </div>
          </div>
        )}

        {tab === 'explainability' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-xs uppercase tracking-widest text-text-muted mb-3">Источники данных</h3>
              <div className="space-y-1.5">
                {agent.dataSources.map(s => (
                  <div key={s} className="flex items-center gap-2 text-sm text-text-secondary">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan shrink-0" />
                    {s}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-xs uppercase tracking-widest text-text-muted mb-3">Ограничения</h3>
              <div className="space-y-1.5">
                {agent.limitations.map(l => (
                  <div key={l} className="flex items-start gap-2 text-sm text-text-secondary">
                    <span className="text-signal-warning mt-0.5 shrink-0">⚠</span>
                    {l}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AgentCatalog() {
  const [filter, setFilter] = useState<AgentCategory | 'all'>('all');
  const [selected, setSelected] = useState<Agent | null>(null);
  const [search, setSearch] = useState('');

  const filtered = AGENTS.filter(a => {
    if (filter !== 'all' && a.category !== filter) return false;
    if (search && !a.name.toLowerCase().includes(search.toLowerCase()) &&
        !a.nameRu.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-xl font-semibold text-text-primary">Каталог агентов</h1>
            <p className="text-sm text-text-muted mt-0.5">{AGENTS.length} агентов в системе</p>
          </div>
          <div className="md:ml-auto flex gap-2 flex-wrap">
            <input
              type="text" placeholder="Поиск..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-bg-card border border-border-subtle rounded-lg px-3 py-1.5 text-sm text-text-primary placeholder-text-muted outline-none focus:border-accent-blue transition-colors"
            />
            {(['all', 'analytic', 'creative', 'orchestrator'] as const).map(c => (
              <button key={c} onClick={() => setFilter(c)}
                className={`tag border transition-colors ${
                  filter === c
                    ? 'bg-accent-blue bg-opacity-15 text-accent-blue border-accent-blue border-opacity-40'
                    : 'bg-bg-card text-text-secondary border-border-subtle hover:text-text-primary'
                }`}>
                {c === 'all' ? 'Все' : CATEGORY_LABELS[c]}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(agent => {
            const statusColor = STATUS_COLORS[agent.status];
            return (
              <div key={agent.id}
                className="glass-panel p-5 flex flex-col gap-4 hover:border-border-DEFAULT cursor-pointer transition-all duration-200 group"
                onClick={() => setSelected(agent)}>
                {/* Top row */}
                <div className="flex items-start gap-3">
                  <AgentAvatar color={agent.color} icon={agent.icon} status={agent.status} size="sm" animate={agent.status === 'computing'} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-text-primary text-sm group-hover:text-accent-blue transition-colors">{agent.name}</div>
                    <div className="text-xs text-text-muted">{agent.nameRu}</div>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="status-dot" style={{ backgroundColor: statusColor }} />
                      <span className="text-xs" style={{ color: statusColor }}>{STATUS_LABELS[agent.status]}</span>
                    </div>
                  </div>
                  <span className={`tag border text-xs ${
                    agent.status === 'dev'
                      ? 'bg-signal-warning bg-opacity-10 text-signal-warning border-signal-warning border-opacity-30'
                      : 'bg-bg-card text-text-muted border-border-subtle'
                  }`}>
                    {CATEGORY_LABELS[agent.category]}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">{agent.description}</p>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  {agent.subAgents > 0 && (
                    <span className="text-xs text-text-muted">{agent.subAgents} субагентов</span>
                  )}
                  <div className="ml-auto flex gap-1.5">
                    <button className="text-xs text-text-muted hover:text-accent-blue transition-colors px-2 py-1 rounded hover:bg-bg-hover"
                      onClick={e => { e.stopPropagation(); setSelected(agent); }}>
                      Тест
                    </button>
                    <button className="text-xs text-text-muted hover:text-text-primary transition-colors px-2 py-1 rounded hover:bg-bg-hover"
                      onClick={e => { e.stopPropagation(); }}>
                      ⋯
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selected && <AgentDetail agent={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
