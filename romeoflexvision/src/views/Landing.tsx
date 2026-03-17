import { useState } from 'react';
import AgentAvatar from '../components/AgentAvatar';
import { AGENTS } from '../data/agents';
import { useI18n } from '../context/I18nContext';
import type { View } from '../types';

interface LandingProps {
  onNavigate: (view: View) => void;
  onRegister: () => void;
}

const DEMO_RESULT = {
  defects: 3,
  confidence: 94.2,
  location: 'Линия A3, позиция 142',
  type: 'Царапина поверхности',
};

export default function Landing({ onNavigate, onRegister }: LandingProps) {
  const { t } = useI18n();
  const [demoActive, setDemoActive] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const FEATURES = [
    { icon: '◈', title: 'Компьютерное зрение', desc: 'QC-агент детектирует дефекты в реальном времени с точностью 94%' },
    { icon: '◉', title: 'Оркестрация задач', desc: 'Центральный маршрутизатор декомпозирует сложные задачи между агентами' },
    { icon: '◆', title: 'Предиктивное обслуживание', desc: 'Прогнозирование отказов оборудования за 72 часа до события' },
    { icon: '⬡', title: 'FinOps & Observability', desc: 'Трекинг токенов, кэша и инфраструктурных затрат в реальном времени' },
  ];

  const handleDemoRun = () => {
    setDemoLoading(true);
    setTimeout(() => { setDemoLoading(false); setDemoActive(true); }, 1800);
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
              {t.landing.industry}
            </span>
            <span className="tag bg-bg-card text-text-muted border border-border-subtle">
              {t.landing.agentic}
            </span>
          </div>

          <h1 className="text-4xl lg:text-6xl font-semibold text-text-primary leading-tight tracking-tight text-balance mb-6">
            {t.landing.heroTitle}<br />
            <span className="text-accent-blue">{t.landing.heroTitleAccent}</span>
          </h1>

          <p className="text-lg text-text-secondary max-w-2xl mb-10 leading-relaxed">
            {t.landing.heroDesc}
          </p>

          <div className="flex flex-wrap gap-3">
            <button onClick={() => onNavigate('catalog')} className="btn-primary px-6 py-3 text-base">
              {t.landing.viewAgents}
            </button>
            <button onClick={handleDemoRun} disabled={demoLoading}
              className="btn-ghost px-6 py-3 text-base border border-border-subtle">
              {demoLoading ? t.landing.demoLoading : t.landing.tryDemo}
            </button>
          </div>
        </div>
      </section>

      {/* QC Demo */}
      {(demoLoading || demoActive) && (
        <section className="px-6 lg:px-12 pb-12">
          <div className="glass-panel p-6 max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-text-muted text-xs uppercase tracking-widest">{t.landing.demoLabel}</span>
              {demoLoading && (
                <span className="flex items-center gap-1.5 text-accent-blue text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-blue animate-pulse" />
                  {t.landing.demoProcessing}
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
                <div className="relative bg-bg-card rounded-lg overflow-hidden h-36 flex items-center justify-center">
                  <div className="absolute inset-0 opacity-20"
                    style={{ background: 'radial-gradient(ellipse at 35% 60%, #ef4444 0%, transparent 40%), radial-gradient(ellipse at 70% 30%, #d97706 0%, transparent 30%)' }} />
                  <div className="relative text-center">
                    <div className="text-text-muted text-xs mb-1">{t.landing.demoHeatmap}</div>
                    <div className="text-4xl font-mono font-bold text-signal-alert">{DEMO_RESULT.defects}</div>
                    <div className="text-text-muted text-xs">{t.landing.demoDetected}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-bg-card rounded-lg p-3">
                    <div className="metric-label mb-1">{t.landing.demoConfidence}</div>
                    <div className="text-2xl font-mono text-text-primary">{DEMO_RESULT.confidence}%</div>
                  </div>
                  <div className="bg-bg-card rounded-lg p-3">
                    <div className="metric-label mb-1">{t.landing.demoDefectType}</div>
                    <div className="text-sm text-signal-warning font-medium">{DEMO_RESULT.type}</div>
                  </div>
                </div>

                <div className="bg-bg-card rounded-lg p-3 text-sm">
                  <span className="text-text-muted">{t.landing.demoLocation}: </span>
                  <span className="text-text-primary font-mono">{DEMO_RESULT.location}</span>
                </div>

                <div className="border border-accent-blue border-opacity-30 bg-accent-blue bg-opacity-5 rounded-lg p-4">
                  <p className="text-sm text-text-secondary mb-3">{t.landing.demoCtaDesc}</p>
                  <button onClick={onRegister} className="btn-primary w-full">
                    {t.landing.demoCreateAccount}
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Agent grid preview */}
      <section className="px-6 lg:px-12 pb-16">
        <h2 className="text-sm uppercase tracking-widest text-text-muted mb-6">{t.landing.agentsSection}</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {AGENTS.filter(a => a.id !== 'orchestrator').map(agent => (
            <button key={agent.id} onClick={() => onNavigate('catalog')}
              className="glass-panel p-4 flex flex-col items-center gap-3 hover:border-border-DEFAULT transition-all duration-200 text-center group">
              <AgentAvatar color={agent.color} icon={agent.icon} status={agent.status} size="sm" animate={false} agentId={agent.id} />
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
        <h2 className="text-sm uppercase tracking-widest text-text-muted mb-8">{t.landing.featuresSection}</h2>
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
