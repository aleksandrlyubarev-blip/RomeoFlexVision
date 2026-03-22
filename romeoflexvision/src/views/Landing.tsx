import { useState } from 'react';
import AgentAvatar from '../components/AgentAvatar';
import { AGENTS } from '../data/agents';
import type { View } from '../types';

interface LandingProps {
  onNavigate: (view: View) => void;
  onRegister: () => void;
}

const FEATURES = [
  { icon: '◈', title: 'Компьютерное зрение', desc: 'QC-агент детектирует дефекты в реальном времени с точностью 94%' },
  { icon: '◉', title: 'Оркестрация задач', desc: 'Центральный маршрутизатор декомпозирует сложные задачи между агентами' },
  { icon: '◆', title: 'Предиктивное обслуживание', desc: 'Прогнозирование отказов оборудования за 72 часа до события' },
  { icon: '⬡', title: 'FinOps & Observability', desc: 'Трекинг токенов, кэша и инфраструктурных затрат в реальном времени' },
];

const DEMO_RESULT = {
  defects: 3,
  confidence: 94.2,
  location: 'Линия A3, позиция 142',
  type: 'Царапина поверхности',
};

// Heatmap grid: 16 cols × 6 rows, values 0-1 (higher = more defect heat)
const COLS = 16;
const ROWS = 6;
const HEATMAP_DATA: number[][] = (() => {
  const grid = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  // Three defect hotspots matching the demo result
  const spots = [
    { r: 3, c: 5, intensity: 1.0 },   // primary defect
    { r: 2, c: 4, intensity: 0.75 },
    { r: 4, c: 6, intensity: 0.6 },
    { r: 1, c: 11, intensity: 0.85 },  // secondary defect
    { r: 2, c: 12, intensity: 0.55 },
    { r: 4, c: 13, intensity: 0.45 },  // third defect
    { r: 3, c: 13, intensity: 0.9 },
  ];
  spots.forEach(({ r, c, intensity }) => {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
          const dist = Math.sqrt(dr * dr + dc * dc);
          grid[nr][nc] = Math.max(grid[nr][nc], intensity * (1 - dist * 0.45));
        }
      }
    }
  });
  return grid;
})();

function heatColor(v: number): string {
  if (v < 0.05) return 'rgba(255,255,255,0.04)';
  const r = Math.round(v * 239 + (1 - v) * 251);
  const g = Math.round((1 - v) * 191);
  const b = Math.round((1 - v) * 36);
  return `rgba(${r},${g},${b},${0.15 + v * 0.85})`;
}

export default function Landing({ onNavigate, onRegister }: LandingProps) {
  const [demoActive, setDemoActive] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const handleDemoRun = () => {
    setDemoLoading(true);
    setTimeout(() => {
      setDemoLoading(false);
      setDemoActive(true);
    }, 1800);
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Hero */}
      <section className="relative overflow-hidden px-6 lg:px-12 py-20 lg:py-28">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #7aa2f7 0%, transparent 70%)' }} />

        <div className="max-w-4xl relative">
          <div className="flex items-center gap-2 mb-6">
            <span className="tag bg-accent-blue bg-opacity-15 text-accent-blue border border-accent-blue border-opacity-30">
              Индустрия 4.0
            </span>
            <span className="tag bg-bg-card text-text-muted border border-border-subtle">
              Agentic AI
            </span>
          </div>

          <h1 className="text-4xl lg:text-6xl font-semibold text-text-primary leading-tight tracking-tight text-balance mb-6">
            Многоагентная ИИ-платформа<br />
            <span className="text-accent-blue">для умного производства</span>
          </h1>

          <p className="text-lg text-text-secondary max-w-2xl mb-10 leading-relaxed">
            RomeoFlexVision объединяет специализированных ИИ-агентов для контроля качества,
            аналитики данных, предиктивного обслуживания и творческих задач в единой среде.
          </p>

          <div className="flex flex-wrap gap-3">
            <button onClick={() => onNavigate('catalog')} className="btn-primary px-6 py-3 text-base">
              Посмотреть агентов
            </button>
            <button
              onClick={handleDemoRun}
              disabled={demoLoading}
              className="btn-ghost px-6 py-3 text-base border border-border-subtle"
            >
              {demoLoading ? 'Анализ...' : 'Попробовать QC-демо ↓'}
            </button>
          </div>
        </div>
      </section>

      {/* Lazy Demo — try before register */}
      {(demoLoading || demoActive) && (
        <section className="px-6 lg:px-12 pb-12">
          <div className="glass-panel p-6 max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-text-muted text-xs uppercase tracking-widest">QC-агент · Live Demo</span>
              {demoLoading && (
                <span className="flex items-center gap-1.5 text-accent-blue text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-blue animate-pulse" />
                  Обработка тестового изображения...
                </span>
              )}
            </div>

            {demoLoading ? (
              <div className="space-y-2">
                {[80, 60, 90].map((w, i) => (
                  <div key={i} className="h-3 rounded bg-bg-card animate-pulse" style={{ width: `${w}%` }} />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Defect heatmap grid */}
                <div className="relative bg-bg-card rounded-lg overflow-hidden">
                  <div className="px-3 pt-3 pb-1 flex items-center justify-between">
                    <span className="text-text-muted text-xs">Тепловая карта дефектов · Линия A3</span>
                    <span className="text-signal-alert text-xs font-mono font-semibold">{DEMO_RESULT.defects} дефекта</span>
                  </div>
                  <div className="px-3 pb-3">
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${COLS}, 1fr)`,
                        gap: '2px',
                      }}
                    >
                      {HEATMAP_DATA.flatMap((row, ri) =>
                        row.map((val, ci) => (
                          <div
                            key={`${ri}-${ci}`}
                            style={{
                              height: '18px',
                              borderRadius: '2px',
                              background: heatColor(val),
                              transition: 'background 0.3s',
                            }}
                            title={val > 0.4 ? `Дефект · интенсивность ${Math.round(val * 100)}%` : undefined}
                          />
                        ))
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex gap-0.5">
                        {[0, 0.25, 0.5, 0.75, 1].map(v => (
                          <div key={v} style={{ width: 12, height: 6, borderRadius: 1, background: heatColor(v) }} />
                        ))}
                      </div>
                      <span className="text-text-muted text-xs">низкий → высокий риск</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-bg-card rounded-lg p-3">
                    <div className="metric-label mb-1">Уверенность</div>
                    <div className="text-2xl font-mono text-text-primary">{DEMO_RESULT.confidence}%</div>
                  </div>
                  <div className="bg-bg-card rounded-lg p-3">
                    <div className="metric-label mb-1">Тип дефекта</div>
                    <div className="text-sm text-signal-warning font-medium">{DEMO_RESULT.type}</div>
                  </div>
                </div>

                <div className="bg-bg-card rounded-lg p-3 text-sm">
                  <span className="text-text-muted">Локация: </span>
                  <span className="text-text-primary font-mono">{DEMO_RESULT.location}</span>
                </div>

                {/* Lazy registration CTA */}
                <div className="border border-accent-blue border-opacity-30 bg-accent-blue bg-opacity-5 rounded-lg p-4">
                  <p className="text-sm text-text-secondary mb-3">
                    Это базовое демо. Для полного доступа к тепловым картам, Chain-of-Thought и исторической аналитике:
                  </p>
                  <button onClick={onRegister} className="btn-primary w-full">
                    Создать бесплатный аккаунт
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Agent grid preview */}
      <section className="px-6 lg:px-12 pb-16">
        <h2 className="text-sm uppercase tracking-widest text-text-muted mb-6">Специализированные агенты</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {AGENTS.filter(a => a.id !== 'orchestrator').map(agent => (
            <button
              key={agent.id}
              onClick={() => onNavigate('catalog')}
              className="glass-panel p-4 flex flex-col items-center gap-3 hover:border-border-DEFAULT transition-all duration-200 text-center group"
            >
              <AgentAvatar color={agent.color} icon={agent.icon} status={agent.status} size="sm" animate={false} />
              <div>
                <div className="text-sm font-medium text-text-primary group-hover:text-accent-blue transition-colors">{agent.name}</div>
                <div className="text-xs text-text-muted mt-0.5">{agent.nameRu}</div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-6 lg:px-12 pb-20 border-t border-border-subtle pt-12">
        <h2 className="text-sm uppercase tracking-widest text-text-muted mb-8">Возможности платформы</h2>
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl">
          {FEATURES.map(f => (
            <div key={f.title} className="flex gap-4">
              <span className="text-2xl text-text-muted mt-0.5 shrink-0">{f.icon}</span>
              <div>
                <div className="text-sm font-semibold text-text-primary mb-1">{f.title}</div>
                <div className="text-sm text-text-secondary">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
