import { useState } from 'react';
import AgentAvatar, { STATUS_LABELS, STATUS_COLORS } from '../components/AgentAvatar';
import { AGENTS } from '../data/agents';
import { useI18n } from '../context/I18nContext';
import type { Agent, AgentCategory } from '../types';

// ---- Detail panel (side panel on md+, bottom sheet on mobile) ----
interface AgentDetailProps {
  agent: Agent;
  onClose: () => void;
  mobile: boolean;
}

function AgentDetail({ agent, onClose, mobile }: AgentDetailProps) {
  const { t } = useI18n();
  const [tab, setTab] = useState<'overview' | 'explainability'>('overview');
  const statusColor = STATUS_COLORS[agent.status];

  const catLabel = agent.category === 'analytic' ? t.catalog.catAnalytic
    : agent.category === 'creative' ? t.catalog.catCreative
    : t.catalog.catOrchestrator;

  const content = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start gap-4 p-5 border-b border-border-subtle shrink-0">
        <AgentAvatar color={agent.color} icon={agent.icon} status={agent.status} size="md" agentId={agent.id} />
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold text-text-primary leading-tight">{agent.name}</h2>
          <div className="text-xs text-text-muted mt-0.5">{agent.nameRu}</div>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="status-dot" style={{ backgroundColor: statusColor }} />
            <span className="text-xs" style={{ color: statusColor }}>{STATUS_LABELS[agent.status]}</span>
            <span className="tag bg-bg-card text-text-muted border border-border-subtle">{catLabel}</span>
            {agent.subAgents > 0 && (
              <span className="text-xs text-text-muted">{agent.subAgents} {t.catalog.subAgents}</span>
            )}
          </div>
        </div>
        <button onClick={onClose} className="text-text-muted hover:text-text-primary p-1 shrink-0 text-lg leading-none">✕</button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border-subtle shrink-0 px-5">
        {(['overview', 'explainability'] as const).map(tb => (
          <button key={tb} onClick={() => setTab(tb)}
            className={`px-1 py-2.5 text-sm mr-4 transition-colors border-b-2 -mb-px ${
              tab === tb ? 'border-accent-blue text-accent-blue' : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}>
            {tb === 'overview' ? t.catalog.tabOverview : t.catalog.tabExplain}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {tab === 'overview' && (
          <>
            <p className="text-sm text-text-secondary leading-relaxed">{agent.description}</p>
            <div className="flex gap-2 flex-wrap pt-1">
              <button className="btn-primary text-xs py-1.5 px-3">{t.catalog.btnTest}</button>
              <button className="btn-ghost text-xs py-1.5 px-3 border border-border-subtle">{t.catalog.btnDuplicate}</button>
              <button className="btn-ghost text-xs py-1.5 px-3 border border-border-subtle">{t.catalog.btnEdit}</button>
            </div>
          </>
        )}

        {tab === 'explainability' && (
          <>
            <div>
              <h3 className="text-xs uppercase tracking-widest text-text-muted mb-3">{t.catalog.dataSources}</h3>
              <div className="space-y-2">
                {agent.dataSources.map(s => (
                  <div key={s} className="flex items-center gap-2 text-sm text-text-secondary">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan shrink-0" />
                    {s}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-xs uppercase tracking-widest text-text-muted mb-3">{t.catalog.limitations}</h3>
              <div className="space-y-2">
                {agent.limitations.map(l => (
                  <div key={l} className="flex items-start gap-2 text-sm text-text-secondary">
                    <span className="text-signal-warning mt-0.5 shrink-0">⚠</span>
                    {l}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );

  // Mobile: bottom sheet with backdrop
  if (mobile) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={onClose}>
        <div className="glass-panel rounded-t-2xl max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-border-subtle" />
          </div>
          {content}
        </div>
      </div>
    );
  }

  // Desktop: slide-in side panel (rendered inside the catalog layout)
  return (
    <div className="w-80 xl:w-96 border-l border-border-subtle bg-bg-secondary flex flex-col overflow-hidden shrink-0 animate-fade-in">
      {content}
    </div>
  );
}

// ---- Main catalog ----
export default function AgentCatalog() {
  const { t } = useI18n();
  const [filter, setFilter] = useState<AgentCategory | 'all'>('all');
  const [selected, setSelected] = useState<Agent | null>(null);
  const [search, setSearch] = useState('');
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  // Track window size to know which variant to render
  useState(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  });

  const CATEGORY_LABELS: Record<AgentCategory, string> = {
    analytic:     t.catalog.catAnalytic,
    creative:     t.catalog.catCreative,
    orchestrator: t.catalog.catOrchestrator,
  };

  const filtered = AGENTS.filter(a => {
    if (filter !== 'all' && a.category !== filter) return false;
    if (search && !a.name.toLowerCase().includes(search.toLowerCase()) &&
        !a.nameRu.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left: grid list */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 lg:px-8 py-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-xl font-semibold text-text-primary">{t.catalog.title}</h1>
              <p className="text-sm text-text-muted mt-0.5">{AGENTS.length} {t.catalog.subtitle}</p>
            </div>
            <div className="md:ml-auto flex gap-2 flex-wrap">
              <input type="text" placeholder={t.catalog.searchPlaceholder} value={search}
                onChange={e => setSearch(e.target.value)}
                className="bg-bg-card border border-border-subtle rounded-lg px-3 py-1.5 text-sm text-text-primary placeholder-text-muted outline-none focus:border-accent-blue transition-colors" />
              {(['all', 'analytic', 'creative', 'orchestrator'] as const).map(c => (
                <button key={c} onClick={() => setFilter(c)}
                  className={`tag border transition-colors ${
                    filter === c
                      ? 'bg-accent-blue bg-opacity-15 text-accent-blue border-accent-blue border-opacity-40'
                      : 'bg-bg-card text-text-secondary border-border-subtle hover:text-text-primary'
                  }`}>
                  {c === 'all' ? t.catalog.filterAll : CATEGORY_LABELS[c]}
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          <div className={`grid gap-4 ${selected && !isMobile ? 'grid-cols-1 lg:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
            {filtered.map(agent => {
              const statusColor = STATUS_COLORS[agent.status];
              const isActive = selected?.id === agent.id;
              return (
                <div key={agent.id}
                  className={`glass-panel p-5 flex flex-col gap-4 cursor-pointer transition-all duration-200 group ${
                    isActive ? 'border-accent-blue border-opacity-60 bg-accent-blue bg-opacity-5' : 'hover:border-border-DEFAULT'
                  }`}
                  onClick={() => setSelected(isActive ? null : agent)}>
                  <div className="flex items-start gap-3">
                    <AgentAvatar color={agent.color} icon={agent.icon} status={agent.status} size="sm" animate={agent.status === 'computing'} agentId={agent.id} />
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium text-sm transition-colors ${isActive ? 'text-accent-blue' : 'text-text-primary group-hover:text-accent-blue'}`}>
                        {agent.name}
                      </div>
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

                  <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">{agent.description}</p>

                  <div className="flex items-center justify-between">
                    {agent.subAgents > 0 && (
                      <span className="text-xs text-text-muted">{agent.subAgents} {t.catalog.subAgents}</span>
                    )}
                    <div className="ml-auto flex gap-1.5">
                      <button className="text-xs text-text-muted hover:text-accent-blue transition-colors px-2 py-1 rounded hover:bg-bg-hover"
                        onClick={e => { e.stopPropagation(); setSelected(agent); }}>
                        {t.catalog.test}
                      </button>
                      <button className="text-xs text-text-muted hover:text-text-primary transition-colors px-2 py-1 rounded hover:bg-bg-hover"
                        onClick={e => e.stopPropagation()}>
                        ⋯
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right: side panel (desktop) */}
      {selected && !isMobile && (
        <AgentDetail agent={selected} onClose={() => setSelected(null)} mobile={false} />
      )}

      {/* Bottom sheet (mobile) */}
      {selected && isMobile && (
        <AgentDetail agent={selected} onClose={() => setSelected(null)} mobile={true} />
      )}
    </div>
  );
}
