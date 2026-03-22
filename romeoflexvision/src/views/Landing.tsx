import { useState } from 'react';
import AgentAvatar from '../components/AgentAvatar';
import { type Language, useLanguage } from '../context/LanguageContext';
import { getAgents } from '../data/agents';
import type { View } from '../types';

interface LandingProps {
  onNavigate: (view: View) => void;
  onRegister: () => void;
}

const COPY: Record<
  Language,
  {
    industry: string;
    platformTag: string;
    titleTop: string;
    titleBottom: string;
    description: string;
    viewAgents: string;
    tryDemo: string;
    analyzing: string;
    demoLabel: string;
    processingDemo: string;
    heatmap: string;
    defectsDetected: string;
    confidence: string;
    defectType: string;
    location: string;
    demoTeaser: string;
    createFreeAccount: string;
    specializedAgents: string;
    platformCapabilities: string;
    features: Array<{ icon: string; title: string; desc: string }>;
    demoResult: { location: string; type: string };
  }
> = {
  en: {
    industry: 'Industry 4.0',
    platformTag: 'Agentic AI',
    titleTop: 'Multi-agent AI platform',
    titleBottom: 'for intelligent manufacturing',
    description:
      'RomeoFlexVision unites specialized AI agents for quality control, data analytics, predictive maintenance, and creative workflows in one environment.',
    viewAgents: 'View agents',
    tryDemo: 'Try QC demo ↓',
    analyzing: 'Analyzing...',
    demoLabel: 'QC Agent · Live Demo',
    processingDemo: 'Processing demo image...',
    heatmap: 'Defect heatmap',
    defectsDetected: 'defects detected',
    confidence: 'Confidence',
    defectType: 'Defect type',
    location: 'Location',
    demoTeaser:
      'This is a lightweight demo. For full access to heatmaps, Chain-of-Thought, and historical analytics:',
    createFreeAccount: 'Create free account',
    specializedAgents: 'Specialized agents',
    platformCapabilities: 'Platform capabilities',
    features: [
      { icon: '◈', title: 'Computer vision', desc: 'A QC agent detects defects in real time with 94% accuracy.' },
      { icon: '◉', title: 'Task orchestration', desc: 'The central router decomposes complex tasks across specialist agents.' },
      { icon: '◆', title: 'Predictive maintenance', desc: 'Equipment failure forecasts arrive up to 72 hours before the event.' },
      { icon: '⬡', title: 'FinOps & Observability', desc: 'Track token usage, cache hits, and infrastructure cost in real time.' },
    ],
    demoResult: { location: 'Line A3, position 142', type: 'Surface scratch' },
  },
  ru: {
    industry: 'Индустрия 4.0',
    platformTag: 'Agentic AI',
    titleTop: 'Многоагентная ИИ-платформа',
    titleBottom: 'для умного производства',
    description:
      'RomeoFlexVision объединяет специализированных ИИ-агентов для контроля качества, аналитики данных, предиктивного обслуживания и творческих задач в единой среде.',
    viewAgents: 'Посмотреть агентов',
    tryDemo: 'Попробовать QC-демо ↓',
    analyzing: 'Анализ...',
    demoLabel: 'QC-агент · Live Demo',
    processingDemo: 'Обработка тестового изображения...',
    heatmap: 'Тепловая карта дефектов',
    defectsDetected: 'обнаружено дефектов',
    confidence: 'Уверенность',
    defectType: 'Тип дефекта',
    location: 'Локация',
    demoTeaser:
      'Это базовое демо. Для полного доступа к тепловым картам, Chain-of-Thought и исторической аналитике:',
    createFreeAccount: 'Создать бесплатный аккаунт',
    specializedAgents: 'Специализированные агенты',
    platformCapabilities: 'Возможности платформы',
    features: [
      { icon: '◈', title: 'Компьютерное зрение', desc: 'QC-агент детектирует дефекты в реальном времени с точностью 94%.' },
      { icon: '◉', title: 'Оркестрация задач', desc: 'Центральный маршрутизатор декомпозирует сложные задачи между агентами.' },
      { icon: '◆', title: 'Предиктивное обслуживание', desc: 'Прогнозирование отказов оборудования за 72 часа до события.' },
      { icon: '⬡', title: 'FinOps & Observability', desc: 'Трекинг токенов, кэша и инфраструктурных затрат в реальном времени.' },
    ],
    demoResult: { location: 'Линия A3, позиция 142', type: 'Царапина поверхности' },
  },
  he: {
    industry: 'Industry 4.0',
    platformTag: 'Agentic AI',
    titleTop: 'פלטפורמת AI מרובת סוכנים',
    titleBottom: 'לייצור חכם',
    description:
      'RomeoFlexVision מאחדת סוכני AI ייעודיים לבקרת איכות, אנליטיקת נתונים, תחזוקה חזויה ומשימות יצירתיות בסביבה אחת.',
    viewAgents: 'צפה בסוכנים',
    tryDemo: 'נסה דמו QC ↓',
    analyzing: 'מנתח...',
    demoLabel: 'סוכן QC · דמו חי',
    processingDemo: 'מעבד תמונת דמו...',
    heatmap: 'מפת חום של פגמים',
    defectsDetected: 'פגמים זוהו',
    confidence: 'רמת ביטחון',
    defectType: 'סוג פגם',
    location: 'מיקום',
    demoTeaser:
      'זהו דמו בסיסי. לגישה מלאה למפות חום, Chain-of-Thought ואנליטיקה היסטורית:',
    createFreeAccount: 'צור חשבון חינם',
    specializedAgents: 'סוכנים ייעודיים',
    platformCapabilities: 'יכולות הפלטפורמה',
    features: [
      { icon: '◈', title: 'ראייה ממוחשבת', desc: 'סוכן QC מזהה פגמים בזמן אמת בדיוק של 94%.' },
      { icon: '◉', title: 'תזמור משימות', desc: 'הנתב המרכזי מפרק משימות מורכבות בין סוכנים מתמחים.' },
      { icon: '◆', title: 'תחזוקה חזויה', desc: 'חיזוי תקלות ציוד עד 72 שעות לפני האירוע.' },
      { icon: '⬡', title: 'FinOps & Observability', desc: 'מעקב אחר טוקנים, cache ועלויות תשתית בזמן אמת.' },
    ],
    demoResult: { location: 'קו A3, עמדה 142', type: 'שריטה על המשטח' },
  },
};

export default function Landing({ onNavigate, onRegister }: LandingProps) {
  const { language } = useLanguage();
  const agents = getAgents(language);
  const copy = COPY[language];
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
      <section className="relative overflow-hidden px-6 lg:px-12 py-20 lg:py-28">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #7aa2f7 0%, transparent 70%)' }}
        />

        <div className="max-w-4xl relative">
          <div className="flex items-center gap-2 mb-6">
            <span className="tag bg-accent-blue bg-opacity-15 text-accent-blue border border-accent-blue border-opacity-30">
              {copy.industry}
            </span>
            <span className="tag bg-bg-card text-text-muted border border-border-subtle">
              {copy.platformTag}
            </span>
          </div>

          <h1 className="text-4xl lg:text-6xl font-semibold text-text-primary leading-tight tracking-tight text-balance mb-6">
            {copy.titleTop}
            <br />
            <span className="text-accent-blue">{copy.titleBottom}</span>
          </h1>

          <p className="text-lg text-text-secondary max-w-2xl mb-10 leading-relaxed">
            {copy.description}
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('catalog')}
              className="btn-primary px-6 py-3 text-base"
            >
              {copy.viewAgents}
            </button>
            <button
              onClick={handleDemoRun}
              disabled={demoLoading}
              className="btn-ghost px-6 py-3 text-base border border-border-subtle"
            >
              {demoLoading ? copy.analyzing : copy.tryDemo}
            </button>
          </div>
        </div>
      </section>

      {(demoLoading || demoActive) && (
        <section className="px-6 lg:px-12 pb-12">
          <div className="glass-panel p-6 max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-text-muted text-xs uppercase tracking-widest">
                {copy.demoLabel}
              </span>
              {demoLoading && (
                <span className="flex items-center gap-1.5 text-accent-blue text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-blue animate-pulse" />
                  {copy.processingDemo}
                </span>
              )}
            </div>

            {demoLoading ? (
              <div className="space-y-2">
                {[80, 60, 90].map((w, index) => (
                  <div
                    key={index}
                    className="h-3 rounded bg-bg-card animate-pulse"
                    style={{ width: `${w}%` }}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative bg-bg-card rounded-lg overflow-hidden h-36 flex items-center justify-center">
                  <div
                    className="absolute inset-0 opacity-20"
                    style={{
                      background:
                        'radial-gradient(ellipse at 35% 60%, #ef4444 0%, transparent 40%), radial-gradient(ellipse at 70% 30%, #d97706 0%, transparent 30%)',
                    }}
                  />
                  <div className="relative text-center">
                    <div className="text-text-muted text-xs mb-1">{copy.heatmap}</div>
                    <div className="text-4xl font-mono font-bold text-signal-alert">3</div>
                    <div className="text-text-muted text-xs">{copy.defectsDetected}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-bg-card rounded-lg p-3">
                    <div className="metric-label mb-1">{copy.confidence}</div>
                    <div className="text-2xl font-mono text-text-primary">94.2%</div>
                  </div>
                  <div className="bg-bg-card rounded-lg p-3">
                    <div className="metric-label mb-1">{copy.defectType}</div>
                    <div className="text-sm text-signal-warning font-medium">
                      {copy.demoResult.type}
                    </div>
                  </div>
                </div>

                <div className="bg-bg-card rounded-lg p-3 text-sm">
                  <span className="text-text-muted">{copy.location}: </span>
                  <span className="text-text-primary font-mono">
                    {copy.demoResult.location}
                  </span>
                </div>

                <div className="border border-accent-blue border-opacity-30 bg-accent-blue bg-opacity-5 rounded-lg p-4">
                  <p className="text-sm text-text-secondary mb-3">{copy.demoTeaser}</p>
                  <button onClick={onRegister} className="btn-primary w-full">
                    {copy.createFreeAccount}
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      <section className="px-6 lg:px-12 pb-16">
        <h2 className="text-sm uppercase tracking-widest text-text-muted mb-6">
          {copy.specializedAgents}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {agents
            .filter((agent) => agent.id !== 'orchestrator')
            .map((agent) => (
              <button
                key={agent.id}
                onClick={() => onNavigate('catalog')}
                className="glass-panel p-4 flex flex-col items-center gap-3 hover:border-border-DEFAULT transition-all duration-200 text-center group"
              >
                <AgentAvatar
                  color={agent.color}
                  icon={agent.icon}
                  status={agent.status}
                  size="sm"
                  animate={false}
                />
                <div>
                  <div className="text-sm font-medium text-text-primary group-hover:text-accent-blue transition-colors">
                    {agent.name}
                  </div>
                  <div className="text-xs text-text-muted mt-0.5">{agent.nameRu}</div>
                </div>
              </button>
            ))}
        </div>
      </section>

      <section className="px-6 lg:px-12 pb-20 border-t border-border-subtle pt-12">
        <h2 className="text-sm uppercase tracking-widest text-text-muted mb-8">
          {copy.platformCapabilities}
        </h2>
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl">
          {copy.features.map((feature) => (
            <div key={feature.title} className="flex gap-4">
              <span className="text-2xl text-text-muted mt-0.5 shrink-0">
                {feature.icon}
              </span>
              <div>
                <div className="text-sm font-semibold text-text-primary mb-1">
                  {feature.title}
                </div>
                <div className="text-sm text-text-secondary">{feature.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
