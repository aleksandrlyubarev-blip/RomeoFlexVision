import { useState } from 'react';
import AgentAvatar, { STATUS_COLORS } from '../components/AgentAvatar';
import { type Language, useLanguage } from '../context/LanguageContext';
import { getAgents } from '../data/agents';
import type { Agent, AgentCategory } from '../types';

const COPY: Record<
  Language,
  {
    title: string;
    count: string;
    search: string;
    all: string;
    overview: string;
    explainability: string;
    test: string;
    duplicate: string;
    edit: string;
    dataSources: string;
    limitations: string;
    subAgents: string;
    statusLabels: Record<Agent['status'], string>;
    categoryLabels: Record<AgentCategory, string>;
  }
> = {
  en: {
    title: 'Agent catalog',
    count: '{count} agents in the system',
    search: 'Search...',
    all: 'All',
    overview: 'Overview',
    explainability: 'Explainability',
    test: 'Test',
    duplicate: 'Duplicate',
    edit: 'Edit',
    dataSources: 'Data sources',
    limitations: 'Limitations',
    subAgents: '{count} sub-agents',
    statusLabels: {
      ready: 'Ready',
      computing: 'Computing',
      error: 'Error',
      idle: 'Idle',
      dev: 'In development',
    },
    categoryLabels: {
      analytic: 'Analytic',
      creative: 'Creative',
      orchestrator: 'Orchestrator',
    },
  },
  ru: {
    title: 'Каталог агентов',
    count: '{count} агентов в системе',
    search: 'Поиск...',
    all: 'Все',
    overview: 'Обзор',
    explainability: 'Объяснимость',
    test: 'Тест',
    duplicate: 'Дублировать',
    edit: 'Редактировать',
    dataSources: 'Источники данных',
    limitations: 'Ограничения',
    subAgents: '{count} субагентов',
    statusLabels: {
      ready: 'Готов',
      computing: 'Вычисление',
      error: 'Ошибка',
      idle: 'Ожидание',
      dev: 'В разработке',
    },
    categoryLabels: {
      analytic: 'Аналитические',
      creative: 'Творческие',
      orchestrator: 'Оркестратор',
    },
  },
  he: {
    title: 'קטלוג הסוכנים',
    count: '{count} סוכנים במערכת',
    search: 'חיפוש...',
    all: 'הכול',
    overview: 'סקירה',
    explainability: 'הסבריות',
    test: 'בדיקה',
    duplicate: 'שכפל',
    edit: 'ערוך',
    dataSources: 'מקורות נתונים',
    limitations: 'מגבלות',
    subAgents: '{count} תתי-סוכנים',
    statusLabels: {
      ready: 'מוכן',
      computing: 'מעבד',
      error: 'שגיאה',
      idle: 'ממתין',
      dev: 'בפיתוח',
    },
    categoryLabels: {
      analytic: 'אנליטיים',
      creative: 'יצירתיים',
      orchestrator: 'מתזמר',
    },
  },
};

function fill(template: string, value: number) {
  return template.replace('{count}', String(value));
}

interface AgentDetailProps {
  agent: Agent;
  copy: (typeof COPY)[Language];
  onClose: () => void;
}

function AgentDetail({ agent, copy, onClose }: AgentDetailProps) {
  const [tab, setTab] = useState<'overview' | 'explainability'>('overview');
  const statusColor = STATUS_COLORS[agent.status];

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-end md:items-center justify-center z-50 p-0 md:p-6"
      onClick={onClose}
    >
      <div
        className="glass-panel w-full md:max-w-xl md:rounded-xl rounded-t-2xl p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4 mb-6">
          <AgentAvatar color={agent.color} icon={agent.icon} status={agent.status} size="md" />
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-text-primary">{agent.name}</h2>
            <div className="text-sm text-text-muted">{agent.nameRu}</div>
            <div className="flex items-center gap-2 mt-2">
              <span className="status-dot" style={{ backgroundColor: statusColor }} />
              <span className="text-xs" style={{ color: statusColor }}>
                {copy.statusLabels[agent.status]}
              </span>
              <span className="tag bg-bg-card text-text-muted border border-border-subtle ml-1">
                {copy.categoryLabels[agent.category]}
              </span>
              {agent.subAgents > 0 && (
                <span className="text-xs text-text-muted">
                  {fill(copy.subAgents, agent.subAgents)}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary p-1">
            ✕
          </button>
        </div>

        <div className="flex gap-1 mb-5 border-b border-border-subtle pb-0">
          {(['overview', 'explainability'] as const).map((currentTab) => (
            <button
              key={currentTab}
              onClick={() => setTab(currentTab)}
              className={`px-3 py-2 text-sm transition-colors border-b-2 -mb-px ${
                tab === currentTab
                  ? 'border-accent-blue text-accent-blue'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              {currentTab === 'overview' ? copy.overview : copy.explainability}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div className="space-y-4">
            <p className="text-sm text-text-secondary leading-relaxed">{agent.description}</p>
            <div className="flex gap-2 flex-wrap">
              <button className="btn-primary text-xs py-1.5 px-3">{copy.test}</button>
              <button className="btn-ghost text-xs py-1.5 px-3 border border-border-subtle">
                {copy.duplicate}
              </button>
              <button className="btn-ghost text-xs py-1.5 px-3 border border-border-subtle">
                {copy.edit}
              </button>
            </div>
          </div>
        )}

        {tab === 'explainability' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-xs uppercase tracking-widest text-text-muted mb-3">
                {copy.dataSources}
              </h3>
              <div className="space-y-1.5">
                {agent.dataSources.map((source) => (
                  <div key={source} className="flex items-center gap-2 text-sm text-text-secondary">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan shrink-0" />
                    {source}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-xs uppercase tracking-widest text-text-muted mb-3">
                {copy.limitations}
              </h3>
              <div className="space-y-1.5">
                {agent.limitations.map((limitation) => (
                  <div key={limitation} className="flex items-start gap-2 text-sm text-text-secondary">
                    <span className="text-signal-warning mt-0.5 shrink-0">⚠</span>
                    {limitation}
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
  const { language } = useLanguage();
  const copy = COPY[language];
  const agents = getAgents(language);
  const [filter, setFilter] = useState<AgentCategory | 'all'>('all');
  const [selected, setSelected] = useState<Agent | null>(null);
  const [search, setSearch] = useState('');

  const filtered = agents.filter((agent) => {
    if (filter !== 'all' && agent.category !== filter) return false;
    if (
      search &&
      !agent.name.toLowerCase().includes(search.toLowerCase()) &&
      !agent.nameRu.toLowerCase().includes(search.toLowerCase()) &&
      !agent.description.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-xl font-semibold text-text-primary">{copy.title}</h1>
            <p className="text-sm text-text-muted mt-0.5">{fill(copy.count, agents.length)}</p>
          </div>
          <div className="md:ml-auto flex gap-2 flex-wrap">
            <input
              type="text"
              placeholder={copy.search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-bg-card border border-border-subtle rounded-lg px-3 py-1.5 text-sm text-text-primary placeholder-text-muted outline-none focus:border-accent-blue transition-colors"
            />
            {(['all', 'analytic', 'creative', 'orchestrator'] as const).map((category) => (
              <button
                key={category}
                onClick={() => setFilter(category)}
                className={`tag border transition-colors ${
                  filter === category
                    ? 'bg-accent-blue bg-opacity-15 text-accent-blue border-accent-blue border-opacity-40'
                    : 'bg-bg-card text-text-secondary border-border-subtle hover:text-text-primary'
                }`}
              >
                {category === 'all' ? copy.all : copy.categoryLabels[category]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((agent) => {
            const statusColor = STATUS_COLORS[agent.status];
            return (
              <div
                key={agent.id}
                className="glass-panel p-5 flex flex-col gap-4 hover:border-border-DEFAULT cursor-pointer transition-all duration-200 group"
                onClick={() => setSelected(agent)}
              >
                <div className="flex items-start gap-3">
                  <AgentAvatar
                    color={agent.color}
                    icon={agent.icon}
                    status={agent.status}
                    size="sm"
                    animate={agent.status === 'computing'}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-text-primary text-sm group-hover:text-accent-blue transition-colors">
                      {agent.name}
                    </div>
                    <div className="text-xs text-text-muted">{agent.nameRu}</div>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="status-dot" style={{ backgroundColor: statusColor }} />
                      <span className="text-xs" style={{ color: statusColor }}>
                        {copy.statusLabels[agent.status]}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`tag border text-xs ${
                      agent.status === 'dev'
                        ? 'bg-signal-warning bg-opacity-10 text-signal-warning border-signal-warning border-opacity-30'
                        : 'bg-bg-card text-text-muted border-border-subtle'
                    }`}
                  >
                    {copy.categoryLabels[agent.category]}
                  </span>
                </div>

                <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">
                  {agent.description}
                </p>

                <div className="flex items-center justify-between">
                  {agent.subAgents > 0 && (
                    <span className="text-xs text-text-muted">
                      {fill(copy.subAgents, agent.subAgents)}
                    </span>
                  )}
                  <div className="ml-auto flex gap-1.5">
                    <button
                      className="text-xs text-text-muted hover:text-accent-blue transition-colors px-2 py-1 rounded hover:bg-bg-hover"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelected(agent);
                      }}
                    >
                      {copy.test}
                    </button>
                    <button
                      className="text-xs text-text-muted hover:text-text-primary transition-colors px-2 py-1 rounded hover:bg-bg-hover"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      ⋯
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selected && <AgentDetail agent={selected} copy={copy} onClose={() => setSelected(null)} />}
    </div>
  );
}
