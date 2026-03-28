import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Github,
  Linkedin,
  Menu,
  MessageCircle,
  Radar,
  ShieldCheck,
  X,
} from 'lucide-react';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useLanguage } from '../context/LanguageContext';
import {
  getSiteContent,
  SITE_LINKS,
  type SiteFaqItem,
  type SiteRoadmapItem,
} from '../data/siteContent';
interface LandingProps {
  onPilotLaunch: () => void;
}

function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let animationId = 0;
    const started = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - started) / duration, 1);
      setValue(Math.round(target * progress));

      if (progress < 1) {
        animationId = requestAnimationFrame(tick);
      }
    };

    animationId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationId);
  }, [duration, target]);

  return value;
}

function RevealBlock({
  id,
  className = '',
  children,
}: {
  id?: string;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.14 }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      id={id}
      ref={ref}
      className={`${className} transition-all duration-700 ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      }`}
    >
      {children}
    </div>
  );
}

function SectionHeader({
  kicker,
  title,
  description,
}: {
  kicker: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-3xl space-y-4">
      <div className="rfv-kicker">{kicker}</div>
      <h2 className="rfv-section-title">{title}</h2>
      <p className="text-base leading-7 text-text-secondary sm:text-lg">{description}</p>
    </div>
  );
}

function MetricCard({ label, value, suffix }: { label: string; value: number; suffix: string }) {
  const count = useCountUp(value);

  return (
    <div className="rfv-card rounded-3xl p-5">
      <div className="font-mono text-3xl font-semibold text-text-primary sm:text-4xl">
        {count.toLocaleString()}
        <span className="text-accent-blue">{suffix}</span>
      </div>
      <div className="mt-2 text-sm leading-6 text-text-secondary">{label}</div>
    </div>
  );
}

function FaqItem({ item }: { item: SiteFaqItem }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rfv-card rounded-3xl p-5">
      <button
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-start justify-between gap-4 text-left"
      >
        <span className="text-base font-medium text-text-primary">{item.question}</span>
        {open ? (
          <ChevronUp size={18} className="mt-0.5 text-accent-blue" />
        ) : (
          <ChevronDown size={18} className="mt-0.5 text-text-muted" />
        )}
      </button>
      {open && <p className="mt-4 text-sm leading-7 text-text-secondary">{item.answer}</p>}
    </div>
  );
}

function comparisonToneClass(tone: 'strong' | 'mid' | 'weak') {
  if (tone === 'strong') {
    return 'border-blue-200 bg-blue-50 text-blue-700';
  }

  if (tone === 'mid') {
    return 'border-slate-200 bg-slate-50 text-slate-700';
  }

  return 'border-slate-200 bg-white text-slate-500';
}

function roadmapToneClass(tone: SiteRoadmapItem['tone']) {
  if (tone === 'success') {
    return 'border-blue-200 bg-blue-50 text-blue-700';
  }

  if (tone === 'warning') {
    return 'border-slate-200 bg-slate-50 text-slate-700';
  }

  return 'border-sky-200 bg-sky-50 text-sky-700';
}

function RoadmapCard({ item, isLast }: { item: SiteRoadmapItem; isLast: boolean }) {
  return (
    <div className="relative pl-10">
      {!isLast && (
        <div className="absolute left-[11px] top-8 h-[calc(100%+1.5rem)] w-px bg-gradient-to-b from-accent-blue/50 to-white/0" />
      )}
      <div className="absolute left-0 top-6 h-[22px] w-[22px] rounded-full border border-accent-blue/30 bg-accent-blue/10 shadow-[0_0_20px_rgba(38,92,209,0.24)]" />
      <article className="rfv-card rounded-[2rem] p-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs uppercase tracking-[0.24em] text-accent-blue">{item.phase}</span>
          <span className={`rounded-full border px-3 py-1 text-[11px] font-medium ${roadmapToneClass(item.tone)}`}>
            {item.status}
          </span>
        </div>
        <h3 className="mt-4 text-xl font-semibold text-text-primary">{item.title}</h3>
        <p className="mt-3 text-sm leading-7 text-text-secondary">{item.description}</p>
      </article>
    </div>
  );
}

export default function Landing({ onPilotLaunch }: LandingProps) {
  const { language } = useLanguage();
  const copy = getSiteContent(language);
  const { ui } = copy;
  const heroVisualCopy = {
    en: {
      surfaceLabel: 'Corporate inspection surface',
      surfaceTitle: 'A cleaner frame for the pilot conversation.',
      coreTitle: 'Station #2 control loop',
      coreText:
        'Inline quality capture, operator proof, and escalation timing in one branded surface.',
      stationLabel: 'Pilot station',
      catchLabel: 'Real-time catch',
      evidenceLabel: 'Evidence mode',
      alertLabel: 'Operator alert',
    },
    ru: {
      surfaceLabel: 'Корпоративная QC-поверхность',
      surfaceTitle: 'Более чистая подача для пилотного разговора.',
      coreTitle: 'Контур станции №2',
      coreText:
        'Inline-поимка дефекта, доказательство для оператора и время эскалации в одной фирменной поверхности.',
      stationLabel: 'Пилотная станция',
      catchLabel: 'Поимка в real-time',
      evidenceLabel: 'Режим доказательства',
      alertLabel: 'Алерт оператору',
    },
    he: {
      surfaceLabel: 'משטח QC תאגידי',
      surfaceTitle: 'מסגרת נקייה יותר לשיחת הפיילוט.',
      coreTitle: 'לולאת תחנה 2',
      coreText: 'תפיסת פגם inline, הוכחה למפעיל ותזמון הסלמה במשטח ממותג אחד.',
      stationLabel: 'תחנת פיילוט',
      catchLabel: 'תפיסה בזמן אמת',
      evidenceLabel: 'מצב הוכחה',
      alertLabel: 'התראת מפעיל',
    },
  }[language];
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navItems = [
    { label: copy.nav.story, href: '#story' },
    { label: copy.nav.pains, href: '#pains' },
    { label: copy.nav.comparison, href: '#comparison' },
    { label: copy.nav.roadmap, href: '#roadmap' },
    { label: copy.nav.contact, href: '#contact' },
  ];

  const brandGuideHref = `${import.meta.env.BASE_URL}brand/${language === 'en' ? '' : `?lang=${language}`}`;
  const storyIcons = [
    <Camera key="story-camera" size={20} />,
    <ShieldCheck key="story-proof" size={20} />,
    <Radar key="story-radar" size={20} />,
  ];

  const handlePilotLaunch = () => {
    onPilotLaunch();
  };

  return (
    <div className="landing-shell relative min-h-screen overflow-x-hidden">
      <div className="pointer-events-none absolute inset-0 rfv-grid opacity-70" />
      <div className="pointer-events-none absolute inset-x-[8%] top-24 h-px bg-[linear-gradient(90deg,transparent,rgba(38,92,209,0.5),transparent)]" />
      <div className="pointer-events-none absolute left-[-12rem] top-[-4rem] h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle,rgba(38,92,209,0.15),transparent_64%)] blur-3xl" />
      <div className="pointer-events-none absolute right-[-6rem] top-[12rem] h-[20rem] w-[20rem] rounded-full bg-[radial-gradient(circle,rgba(143,179,255,0.2),transparent_68%)] blur-3xl" />
      <div className="pointer-events-none absolute left-[10%] top-[36rem] h-[18rem] w-[18rem] rounded-full bg-[radial-gradient(circle,rgba(38,92,209,0.08),transparent_72%)] blur-3xl" />

      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled ? 'landing-header landing-header-scrolled' : 'landing-header'
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-5 py-4 sm:px-6 lg:px-8">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-3 text-left"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#bfd2f7] bg-white shadow-[0_18px_40px_rgba(38,92,209,0.14)]">
              <img
                src={`${import.meta.env.BASE_URL}assets/brand/roboqc-icon-64.png`}
                alt="RoboQC"
                className="h-9 w-9"
              />
            </div>
            <div>
              <div className="text-sm font-semibold tracking-wide text-text-primary">RoboQC</div>
              <div className="text-[11px] uppercase tracking-[0.24em] text-text-muted">
                {copy.labels.poweredBy}
              </div>
            </div>
          </button>

          <nav className="hidden items-center gap-8 lg:ml-10 lg:flex">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="landing-nav-link text-sm"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="ml-auto hidden items-center gap-3 lg:flex">
            <LanguageSwitcher />
            <a href={SITE_LINKS.github} target="_blank" rel="noreferrer" className="btn-ghost px-4 py-2 text-sm">
              {copy.nav.github}
            </a>
            <a
              href={SITE_LINKS.telegram}
              target="_blank"
              rel="noreferrer"
              className="btn-ghost px-4 py-2 text-sm"
            >
              {copy.nav.telegram}
            </a>
            <a
              href={SITE_LINKS.linkedin}
              target="_blank"
              rel="noreferrer"
              className="btn-ghost px-4 py-2 text-sm"
            >
              {copy.nav.linkedin}
            </a>
            <button onClick={handlePilotLaunch} className="btn-primary px-4 py-2 text-sm">
              {copy.nav.pilot}
            </button>
          </div>

          <div className="ml-auto flex items-center gap-2 lg:hidden">
            <LanguageSwitcher />
            <button
              onClick={() => setMobileMenuOpen((current) => !current)}
              className="landing-icon-button inline-flex h-11 w-11 items-center justify-center rounded-2xl"
              aria-label={mobileMenuOpen ? copy.nav.close : copy.nav.menu}
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="landing-mobile-panel px-5 py-5 lg:hidden">
            <div className="flex flex-col gap-3">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="landing-mobile-link rounded-2xl px-4 py-3 text-sm"
                >
                  {item.label}
                </a>
              ))}

              <div className="grid grid-cols-3 gap-3 pt-2">
                <a href={SITE_LINKS.github} target="_blank" rel="noreferrer" className="btn-ghost text-center text-sm">
                  {copy.nav.github}
                </a>
                <a
                  href={SITE_LINKS.telegram}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-ghost text-center text-sm"
                >
                  {copy.nav.telegram}
                </a>
                <a
                  href={SITE_LINKS.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-ghost text-center text-sm"
                >
                  {copy.nav.linkedin}
                </a>
              </div>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handlePilotLaunch();
                }}
                className="btn-primary mt-2 text-sm"
              >
                {copy.nav.pilot}
              </button>
            </div>
          </div>
        )}
      </header>

      <main>
        <section className="relative px-5 pb-16 pt-14 sm:px-6 lg:px-8 lg:pb-24 lg:pt-20">
          <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-8">
              <div className="rfv-kicker">{copy.hero.eyebrow}</div>

              <div className="space-y-5">
                <h1 className="max-w-4xl text-balance text-5xl font-semibold leading-[0.94] tracking-tight text-text-primary sm:text-6xl lg:text-7xl">
                  {copy.hero.title}
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-text-secondary sm:text-xl">
                  {copy.hero.subtitle}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button onClick={handlePilotLaunch} className="btn-primary inline-flex items-center gap-2 px-6 py-3 text-sm sm:text-base">
                  {copy.nav.pilot}
                  <ArrowRight size={16} />
                </button>
                <a
                  href="#comparison"
                  className="landing-btn-secondary inline-flex px-6 py-3 text-sm sm:text-base"
                >
                  {copy.hero.secondaryCta}
                  <ArrowRight size={16} />
                </a>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm text-text-secondary">
                {copy.hero.badges.map((badge) => (
                  <span key={badge} className="rfv-pill">
                    <CheckCircle2 size={14} className="text-accent-blue" />
                    {badge}
                  </span>
                ))}
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {copy.metrics.map((metric) => (
                  <MetricCard key={metric.label} {...metric} />
                ))}
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[560px]">
              <div className="rfv-hero-glow absolute inset-0 rounded-[2.4rem] bg-[radial-gradient(circle_at_top,rgba(38,92,209,0.22),transparent_60%)] blur-3xl" />
              <div className="rfv-card rfv-hero-frame rfv-hero-shell relative overflow-hidden rounded-[2.4rem] p-4 sm:p-5">
                <div className="hero-visual-stage rounded-[2rem] p-5 sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="max-w-[18rem] space-y-3">
                      <div className="landing-hero-chip rfv-hero-chip inline-flex rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em]">
                        {heroVisualCopy.surfaceLabel}
                      </div>
                      <div className="text-2xl font-semibold leading-tight text-text-primary">
                        {heroVisualCopy.surfaceTitle}
                      </div>
                    </div>

                    <div className="hero-visual-brand">
                      <img
                        src={`${import.meta.env.BASE_URL}assets/brand/roboqc-mark.svg`}
                        alt="RoboQC mark"
                        className="h-12 w-12 shrink-0"
                      />
                      <div>
                        <div className="text-sm font-semibold uppercase tracking-[0.18em] text-accent-blue">
                          RoboQC
                        </div>
                        <div className="mt-1 text-sm text-text-secondary">{copy.labels.poweredBy}</div>
                      </div>
                    </div>
                  </div>

                  <div className="hero-visual-constellation mt-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="hero-visual-mini-card">
                        <div className="hero-visual-mini-label">{heroVisualCopy.stationLabel}</div>
                        <div className="hero-visual-mini-value">#{copy.metrics[2]?.value ?? 2}</div>
                      </div>
                      <div className="hero-visual-mini-card">
                        <div className="hero-visual-mini-label">{heroVisualCopy.catchLabel}</div>
                        <div className="hero-visual-mini-value">
                          {copy.metrics[0]?.value}
                          {copy.metrics[0]?.suffix}
                        </div>
                      </div>
                    </div>

                    <div className="hero-visual-core mt-4">
                      <div className="hero-visual-core-badge">
                        <img
                          src={`${import.meta.env.BASE_URL}assets/brand/roboqc-mark.svg`}
                          alt="RoboQC mark"
                          className="h-16 w-16"
                        />
                      </div>
                      <div className="mt-4 inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/84">
                        {copy.hero.imageBadge}
                      </div>
                      <div className="mt-5 text-2xl font-semibold text-white">{heroVisualCopy.coreTitle}</div>
                      <p className="mx-auto mt-3 max-w-[21rem] text-sm leading-7 text-blue-50/88">
                        {heroVisualCopy.coreText}
                      </p>
                      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                        <span className="hero-visual-core-pill">{ui.liveLabel}</span>
                        <span className="hero-visual-core-pill">{ui.proofLabel}</span>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div className="hero-visual-mini-card">
                        <div className="hero-visual-mini-label">{heroVisualCopy.evidenceLabel}</div>
                        <div className="hero-visual-mini-value">{ui.proofLabel}</div>
                      </div>
                      <div className="hero-visual-mini-card">
                        <div className="hero-visual-mini-label">{heroVisualCopy.alertLabel}</div>
                        <div className="hero-visual-mini-value">
                          {copy.metrics[3]?.value}
                          {copy.metrics[3]?.suffix}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div className="landing-hero-overlay-card rounded-[1.6rem] p-4">
                      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-accent-blue">
                        <Radar size={15} />
                        {ui.liveLabel}
                      </div>
                      <div className="mt-3 text-lg font-semibold text-text-primary">{copy.hero.imageStat}</div>
                      <p className="mt-2 text-sm leading-6 text-text-secondary">
                        {copy.labels.poweredBy}
                      </p>
                    </div>

                    <div className="landing-hero-overlay-card rounded-[1.6rem] p-4">
                      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-accent-blue">
                        <Camera size={15} />
                        {ui.proofLabel}
                      </div>
                      <div className="mt-3 text-lg font-semibold text-text-primary">{ui.proofTitle}</div>
                      <p className="mt-2 text-sm leading-6 text-text-secondary">{ui.proofDescription}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <RevealBlock id="story" className="px-5 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="landing-section-shell landing-section-shell-accent space-y-10">
              <SectionHeader
                kicker={copy.nav.story}
                title={copy.sections.story}
                description={copy.sections.storyDescription}
              />

              <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="grid gap-5 md:grid-cols-3">
                  {copy.storyCards.map((card, index) => (
                    <article key={card.title} className="rfv-card landing-story-card rounded-[2rem] p-6">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-accent-blue/20 bg-accent-blue/10 text-accent-blue">
                        {storyIcons[index] ?? <Radar size={20} />}
                      </div>
                      <h3 className="mt-5 text-xl font-semibold text-text-primary">{card.title}</h3>
                      <p className="mt-3 text-sm leading-7 text-text-secondary">{card.description}</p>
                    </article>
                  ))}
                </div>

                <div className="rfv-card landing-story-quote rounded-[2rem] p-7">
                  <div className="text-xs uppercase tracking-[0.24em] text-text-muted">{copy.labels.poweredBy}</div>
                  <div className="mt-4 text-3xl font-semibold leading-tight text-text-primary">{ui.storyQuote}</div>
                  <p className="mt-4 text-base leading-7 text-text-secondary">{copy.labels.footerNote}</p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <a href={SITE_LINKS.github} target="_blank" rel="noreferrer" className="rfv-pill">
                      <Github size={16} />
                      GitHub
                    </a>
                    <a href={brandGuideHref} className="rfv-pill">
                      <ShieldCheck size={16} />
                      {ui.brandGuideLabel}
                    </a>
                    <a href={SITE_LINKS.telegram} target="_blank" rel="noreferrer" className="rfv-pill">
                      <MessageCircle size={16} />
                      {SITE_LINKS.telegramHandle}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </RevealBlock>

        <RevealBlock id="pains" className="px-5 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="landing-section-shell space-y-10">
              <SectionHeader
                kicker={copy.nav.pains}
                title={copy.sections.pains}
                description={copy.sections.painsDescription}
              />

              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
                {copy.pains.map((pain, index) => (
                  <article key={pain.title} className="rfv-card landing-pain-card rounded-[2rem] p-6">
                    <div className="landing-pain-index">0{index + 1}</div>
                    <h3 className="mt-4 text-lg font-semibold text-text-primary">{pain.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-text-secondary">{pain.description}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </RevealBlock>

        <RevealBlock id="comparison" className="px-5 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="landing-section-shell landing-section-shell-plain space-y-10">
              <SectionHeader
                kicker={copy.nav.comparison}
                title={copy.sections.comparison}
                description={copy.sections.comparisonDescription}
              />

              <div className="rfv-card landing-comparison-card overflow-hidden rounded-[2rem]">
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200/90">
                        <th className="min-w-[260px] px-6 py-5 text-left text-xs uppercase tracking-[0.22em] text-text-muted">
                          {ui.capabilityLabel}
                        </th>
                        {copy.labels.comparisonColumns.map((column, index) => (
                          <th
                            key={column}
                            className={`min-w-[140px] px-4 py-5 text-left text-xs uppercase tracking-[0.22em] ${
                              index === 0
                                ? 'landing-comparison-header-highlight'
                                : 'text-text-muted'
                            }`}
                          >
                            {column}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {copy.comparisonRows.map((row) => (
                        <tr key={row.capability} className="border-b border-slate-200/70 last:border-b-0">
                          <td className="px-6 py-5 text-sm font-medium text-text-primary">{row.capability}</td>
                          {row.values.map((cell, index) => (
                            <td key={`${row.capability}-${index}`} className="px-4 py-5">
                              <span
                                className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-medium ${
                                  index === 0
                                    ? 'landing-comparison-cell-highlight'
                                    : comparisonToneClass(cell.tone)
                                }`}
                              >
                                {cell.label}
                              </span>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </RevealBlock>

        <RevealBlock id="roadmap" className="px-5 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-7xl space-y-10">
            <SectionHeader
              kicker={copy.nav.roadmap}
              title={copy.sections.roadmap}
              description={copy.sections.roadmapDescription}
            />

            <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
              <div className="rfv-card rounded-[2rem] p-7">
                <div className="rfv-kicker">{copy.labels.poweredBy}</div>
                <div className="mt-5 text-3xl font-semibold leading-tight text-text-primary">
                  {copy.labels.footerNote}
                </div>
                <p className="mt-4 text-base leading-7 text-text-secondary">
                  {copy.sections.roadmapDescription}
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {copy.hero.badges.map((badge) => (
                    <span key={badge} className="rfv-pill">
                      <CheckCircle2 size={14} className="text-accent-blue" />
                      {badge}
                    </span>
                  ))}
                </div>
                <button
                  onClick={handlePilotLaunch}
                  className="btn-primary mt-8 inline-flex items-center gap-2 px-5 py-3 text-sm"
                >
                  <ArrowRight size={16} />
                  {copy.nav.pilot}
                </button>
              </div>

              <div className="space-y-6">
                {copy.roadmap.map((item, index) => (
                  <RoadmapCard
                    key={`${item.phase}-${item.title}`}
                    item={item}
                    isLast={index === copy.roadmap.length - 1}
                  />
                ))}
              </div>
            </div>
          </div>
        </RevealBlock>

        <RevealBlock className="px-5 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="landing-section-shell space-y-10">
              <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="rfv-card landing-community-panel rounded-[2rem] p-7">
                  <div className="rfv-kicker">{copy.labels.poweredBy}</div>
                  <h2 className="mt-5 text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">
                    {copy.sections.community}
                  </h2>
                  <p className="mt-4 max-w-2xl text-base leading-7 text-text-secondary">
                    {copy.sections.communityDescription}
                  </p>

                  <div className="mt-8 space-y-4">
                    {copy.hero.badges.map((badge) => (
                      <div key={badge} className="flex gap-3 text-sm leading-7 text-text-secondary">
                        <span className="mt-2 h-2.5 w-2.5 rounded-full bg-accent-blue" />
                        <span>{badge}</span>
                      </div>
                    ))}
                  </div>

                  <button onClick={handlePilotLaunch} className="btn-primary mt-8 inline-flex items-center gap-2 px-5 py-3 text-sm">
                    <MessageCircle size={16} />
                    {copy.nav.pilot}
                  </button>
                </div>

                <div className="grid gap-4">
                  {copy.communityCards.map((card) => (
                    <a
                      key={card.title}
                      href={card.href}
                      target="_blank"
                      rel="noreferrer"
                      className="rfv-card landing-community-card rounded-[2rem] p-6 transition-transform duration-200 hover:-translate-y-1"
                    >
                      <div className="flex items-center gap-3">
                        {card.title === 'GitHub' ? (
                          <Github size={20} className="text-accent-blue" />
                        ) : card.title === 'LinkedIn' ? (
                          <Linkedin size={20} className="text-accent-blue" />
                        ) : (
                          <MessageCircle size={20} className="text-accent-blue" />
                        )}
                        <div className="text-lg font-semibold text-text-primary">{card.title}</div>
                      </div>
                      <p className="mt-3 text-sm leading-7 text-text-secondary">{card.description}</p>
                      <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-accent-blue">
                        {card.action}
                        <ArrowRight size={16} />
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </RevealBlock>

        <RevealBlock className="px-5 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-7xl space-y-10">
            <SectionHeader kicker={ui.faqKicker} title={copy.sections.faq} description={copy.sections.faqDescription} />
            <div className="grid gap-4 lg:grid-cols-2">
              {copy.faq.map((item) => (
                <FaqItem key={item.question} item={item} />
              ))}
            </div>
          </div>
        </RevealBlock>
      </main>

      <footer id="contact" className="landing-footer px-5 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="rfv-card landing-footer-panel rounded-[2rem] p-7 sm:p-8 lg:p-10">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(220px,0.72fr)_minmax(0,1fr)]">
              <div className="space-y-5">
                <div className="landing-footer-brand">
                  <div className="landing-footer-mark">
                    <img
                      src={`${import.meta.env.BASE_URL}assets/brand/roboqc-mark.svg`}
                      alt="RoboQC"
                      className="h-11 w-11"
                    />
                  </div>
                  <div>
                    <div className="text-2xl font-semibold tracking-tight text-text-primary">RoboQC</div>
                    <div className="mt-1 text-sm text-text-secondary">{copy.labels.poweredBy}</div>
                  </div>
                </div>

                <p className="max-w-xl text-base leading-8 text-text-secondary">{copy.labels.footerSummary}</p>
                <div className="landing-footer-note">{copy.labels.footerNote}</div>
              </div>

              <div>
                <div className="landing-footer-heading">{copy.nav.contact}</div>
                <div className="mt-5 flex flex-col gap-3 text-sm">
                  {navItems.map((item) => (
                    <a key={item.href} href={item.href} className="landing-footer-navchip">
                      {item.label}
                    </a>
                  ))}
                </div>
              </div>

              <div>
                <div className="landing-footer-heading">{ui.socialLabel}</div>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <a href={brandGuideHref} className="rfv-pill">
                    <ShieldCheck size={16} />
                    {ui.brandGuideLabel}
                  </a>
                  <a href={SITE_LINKS.github} target="_blank" rel="noreferrer" className="rfv-pill">
                    <Github size={16} />
                    GitHub
                  </a>
                  <a href={SITE_LINKS.telegram} target="_blank" rel="noreferrer" className="rfv-pill">
                    <MessageCircle size={16} />
                    {SITE_LINKS.telegramHandle}
                  </a>
                  <a href={SITE_LINKS.linkedin} target="_blank" rel="noreferrer" className="rfv-pill">
                    <Linkedin size={16} />
                    LinkedIn
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-10 flex flex-col gap-3 border-t border-slate-200/90 pt-6 text-xs text-text-muted sm:flex-row sm:items-center sm:justify-between">
              <span>{copy.labels.rights}</span>
              <span className="inline-flex items-center gap-2 self-start rounded-full border border-accent-blue/20 bg-accent-blue/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-blue sm:self-auto">
                <ShieldCheck size={14} />
                {copy.labels.poweredBy}
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}



