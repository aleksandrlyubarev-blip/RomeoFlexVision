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
  type SiteFlowStep,
  type SiteProduct,
  type SiteRoadmapItem,
  type SiteTechGroup,
} from '../data/siteContent';
import type { View } from '../types';

interface LandingProps {
  onNavigate: (view: View) => void;
  onLogin: () => void;
  onRegister: () => void;
  onSignOut: () => void;
  isAuthenticated: boolean;
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

function ProductCard({ product, openLabel }: { product: SiteProduct; openLabel: string }) {
  const statusTone =
    product.statusTone === 'success'
      ? 'border-blue-300/30 bg-blue-400/10 text-blue-100'
      : product.statusTone === 'warning'
        ? 'border-slate-200/15 bg-white/5 text-slate-100'
        : 'border-sky-300/25 bg-sky-400/10 text-sky-100';

  return (
    <article className="rfv-card group relative overflow-hidden rounded-[2rem] p-6">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-blue/80 to-transparent opacity-80" />
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.24em] text-text-muted">{product.eyebrow}</div>
          <h3 className="mt-2 text-2xl font-semibold text-text-primary">{product.title}</h3>
        </div>
        <span className={`rounded-full border px-3 py-1 text-[11px] font-medium ${statusTone}`}>
          {product.status}
        </span>
      </div>

      <p className="mt-4 text-sm leading-7 text-text-secondary">{product.description}</p>

      <div className="mt-5 flex flex-wrap gap-2">
        {product.tags.map((tag) => (
          <span key={tag} className="rfv-pill">
            {tag}
          </span>
        ))}
      </div>

      <a
        href={product.repoUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-accent-blue transition-colors hover:text-white"
      >
        {openLabel}
        <ArrowRight size={16} />
      </a>
    </article>
  );
}

function TechGroupCard({ group }: { group: SiteTechGroup }) {
  return (
    <article className="rfv-card rounded-[2rem] p-6">
      <div className="text-xs uppercase tracking-[0.24em] text-text-muted">{group.title}</div>
      <p className="mt-3 text-sm leading-7 text-text-secondary">{group.description}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        {group.items.map((item) => (
          <span key={item} className="rfv-pill">
            {item}
          </span>
        ))}
      </div>
    </article>
  );
}

function FlowStepCard({ step, icon }: { step: SiteFlowStep; icon: ReactNode }) {
  return (
    <article className="rfv-card relative overflow-hidden rounded-[2rem] p-6">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-blue/70 to-transparent" />
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.24em] text-accent-blue">{step.eyebrow}</div>
          <h3 className="mt-3 text-xl font-semibold text-text-primary">{step.title}</h3>
        </div>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-accent-blue/20 bg-accent-blue/10 text-accent-blue">
          {icon}
        </div>
      </div>
      <p className="mt-4 text-sm leading-7 text-text-secondary">{step.description}</p>
      <div className="mt-5 rounded-[1.25rem] border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-xs leading-6 text-text-muted">
        {step.note}
      </div>
    </article>
  );
}

function comparisonToneClass(tone: 'strong' | 'mid' | 'weak') {
  if (tone === 'strong') {
    return 'border-blue-300/25 bg-blue-400/10 text-blue-50';
  }

  if (tone === 'mid') {
    return 'border-white/10 bg-white/5 text-text-secondary';
  }

  return 'border-white/10 bg-transparent text-text-muted';
}

function roadmapToneClass(tone: SiteRoadmapItem['tone']) {
  if (tone === 'success') {
    return 'border-blue-300/25 bg-blue-400/10 text-blue-100';
  }

  if (tone === 'warning') {
    return 'border-slate-200/12 bg-white/[0.05] text-slate-100';
  }

  return 'border-sky-300/25 bg-sky-400/10 text-sky-100';
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

export default function Landing({ onNavigate, onRegister, isAuthenticated }: LandingProps) {
  const { language } = useLanguage();
  const copy = getSiteContent(language);
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
    { label: copy.nav.products, href: '#products' },
    { label: copy.nav.stack, href: '#stack' },
    { label: copy.nav.roadmap, href: '#roadmap' },
    { label: copy.nav.contact, href: '#contact' },
  ];

  const landingUiCopy = {
    en: {
      liveLabel: 'RoboQC live',
      proofLabel: 'Inline proof',
      proofTitle: 'Frame, trace, decision',
      proofDescription: 'Catch the defect where it starts, with evidence the line can act on immediately.',
      storyQuote: '"The robot-camera that never sleeps."',
      capabilityLabel: 'Capability',
      socialLabel: 'Social',
      brandGuideLabel: 'Brand guide',
      faqKicker: 'FAQ',
    },
    ru: {
      liveLabel: 'RoboQC в линии',
      proofLabel: 'Inline-доказательство',
      proofTitle: 'Кадр, trace, решение',
      proofDescription: 'Ловим дефект там, где он появляется, и сразу даём линии доказательство для действия.',
      storyQuote: '"Робот-камера, которая никогда не спит."',
      capabilityLabel: 'Возможность',
      socialLabel: 'Соцсети',
      brandGuideLabel: 'Бренд-гайд',
      faqKicker: 'FAQ',
    },
    he: {
      liveLabel: 'RoboQC בזמן אמת',
      proofLabel: 'הוכחה מהתחנה',
      proofTitle: 'פריים, עקבה, החלטה',
      proofDescription: 'תופסים את הפגם במקום שבו הוא נוצר, עם הוכחה שהקו יכול לפעול עליה מיד.',
      storyQuote: '"הרובוט-מצלמה שלא ישן לעולם."',
      capabilityLabel: 'יכולת',
      socialLabel: 'קישורים',
      brandGuideLabel: 'מדריך מותג',
      faqKicker: 'שאלות נפוצות',
    },
  }[language];

  const brandGuideHref = `${import.meta.env.BASE_URL}brand/${language === 'en' ? '' : `?lang=${language}`}`;
  const flowIcons = [
    <Camera key="capture" size={20} />,
    <Radar key="score" size={20} />,
    <ShieldCheck key="package" size={20} />,
    <MessageCircle key="act" size={20} />,
  ];
  const storyIcons = [
    <Camera key="story-camera" size={20} />,
    <ShieldCheck key="story-proof" size={20} />,
    <Radar key="story-radar" size={20} />,
  ];

  const handlePilotLaunch = () => {
    if (isAuthenticated) {
      onNavigate('catalog');
      return;
    }

    onRegister();
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-bg-primary text-text-primary">
      <div className="pointer-events-none absolute inset-0 rfv-grid opacity-40" />
      <div className="absolute left-[-12rem] top-[-10rem] h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(circle,rgba(38,92,209,0.25),transparent_62%)] blur-3xl" />
      <div className="absolute right-[-8rem] top-[18rem] h-[24rem] w-[24rem] rounded-full bg-[radial-gradient(circle,rgba(143,179,255,0.16),transparent_62%)] blur-3xl" />

      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled ? 'border-b border-white/10 bg-bg-primary/80 backdrop-blur-xl' : 'bg-transparent'
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-5 py-4 sm:px-6 lg:px-8">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-3 text-left"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-accent-blue/25 bg-accent-blue/10 shadow-[0_0_24px_rgba(38,92,209,0.18)]">
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
                className="text-sm text-text-secondary transition-colors hover:text-white"
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
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-text-primary backdrop-blur-md"
              aria-label={mobileMenuOpen ? copy.nav.close : copy.nav.menu}
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-white/10 bg-bg-primary/95 px-5 py-5 backdrop-blur-xl lg:hidden">
            <div className="flex flex-col gap-3">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-text-secondary"
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
                  {copy.hero.primaryCta}
                  <ArrowRight size={16} />
                </button>
                <a
                  href="#comparison"
                  className="btn-ghost inline-flex items-center gap-2 border border-white/10 px-6 py-3 text-sm sm:text-base"
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
              <div className="rfv-card rfv-hero-frame rfv-hero-shell relative overflow-hidden rounded-[2.4rem] p-3">
                <div className="rfv-hero-chip absolute left-5 top-5 z-20 inline-flex rounded-full border border-white/10 bg-[#0b1220]/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-accent-blue backdrop-blur">
                  {copy.hero.imageBadge}
                </div>

                <img
                  src={`${import.meta.env.BASE_URL}assets/brand/romeo-photo.jpg`}
                  alt={copy.hero.imageAlt}
                  className="rfv-hero-photo h-[520px] w-full rounded-[2rem] object-cover object-center"
                />

                <div className="pointer-events-none absolute inset-3 rounded-[2rem] bg-gradient-to-t from-[#0b1220] via-[#0b1220]/18 to-transparent" />

                <div className="absolute bottom-7 left-7 right-7 z-20 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[1.6rem] border border-white/10 bg-[#0b1220]/80 p-4 backdrop-blur-xl">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-accent-blue">
                      <Radar size={15} />
                      {landingUiCopy.liveLabel}
                    </div>
                    <div className="mt-3 text-lg font-semibold text-text-primary">{copy.hero.imageStat}</div>
                    <p className="mt-2 text-sm leading-6 text-text-secondary">
                      {copy.labels.poweredBy}
                    </p>
                  </div>

                  <div className="rounded-[1.6rem] border border-white/10 bg-[#0b1220]/75 p-4 backdrop-blur-xl">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-accent-blue">
                      <Camera size={15} />
                      {landingUiCopy.proofLabel}
                    </div>
                    <div className="mt-3 text-lg font-semibold text-text-primary">{landingUiCopy.proofTitle}</div>
                    <p className="mt-2 text-sm leading-6 text-text-secondary">{landingUiCopy.proofDescription}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <RevealBlock id="story" className="px-5 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-7xl space-y-10">
            <SectionHeader
              kicker={copy.nav.story}
              title={copy.sections.story}
              description={copy.sections.storyDescription}
            />

            <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="grid gap-5 md:grid-cols-3">
                {copy.storyCards.map((card, index) => (
                  <article key={card.title} className="rfv-card rounded-[2rem] p-6">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-accent-blue/20 bg-accent-blue/10 text-accent-blue">
                      {storyIcons[index] ?? <Radar size={20} />}
                    </div>
                    <h3 className="mt-5 text-xl font-semibold text-text-primary">{card.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-text-secondary">{card.description}</p>
                  </article>
                ))}
              </div>

              <div className="rfv-card rounded-[2rem] p-7">
                <div className="text-xs uppercase tracking-[0.24em] text-text-muted">{copy.labels.poweredBy}</div>
                <div className="mt-4 text-3xl font-semibold leading-tight text-text-primary">{landingUiCopy.storyQuote}</div>
                <p className="mt-4 text-base leading-7 text-text-secondary">{copy.labels.footerNote}</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <a href={SITE_LINKS.github} target="_blank" rel="noreferrer" className="rfv-pill">
                    <Github size={16} />
                    GitHub
                  </a>
                  <a href={brandGuideHref} className="rfv-pill">
                    <ShieldCheck size={16} />
                    {landingUiCopy.brandGuideLabel}
                  </a>
                  <a href={SITE_LINKS.telegram} target="_blank" rel="noreferrer" className="rfv-pill">
                    <MessageCircle size={16} />
                    {SITE_LINKS.telegramHandle}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </RevealBlock>

        <RevealBlock id="pains" className="px-5 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-7xl space-y-10">
            <SectionHeader
              kicker={copy.nav.pains}
              title={copy.sections.pains}
              description={copy.sections.painsDescription}
            />

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
              {copy.pains.map((pain, index) => (
                <article key={pain.title} className="rfv-card rounded-[2rem] p-6">
                  <div className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-blue">
                    0{index + 1}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-text-primary">{pain.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-text-secondary">{pain.description}</p>
                </article>
              ))}
            </div>
          </div>
        </RevealBlock>

        <RevealBlock id="comparison" className="px-5 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-7xl space-y-10">
            <SectionHeader
              kicker={copy.nav.comparison}
              title={copy.sections.comparison}
              description={copy.sections.comparisonDescription}
            />

            <div className="rfv-card overflow-hidden rounded-[2rem]">
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.08]">
                      <th className="min-w-[260px] px-6 py-5 text-left text-xs uppercase tracking-[0.22em] text-text-muted">
                        {landingUiCopy.capabilityLabel}
                      </th>
                      {copy.labels.comparisonColumns.map((column) => (
                        <th
                          key={column}
                          className="min-w-[140px] px-4 py-5 text-left text-xs uppercase tracking-[0.22em] text-text-muted"
                        >
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {copy.comparisonRows.map((row) => (
                      <tr key={row.capability} className="border-b border-white/[0.08] last:border-b-0">
                        <td className="px-6 py-5 text-sm font-medium text-text-primary">{row.capability}</td>
                        {row.values.map((cell, index) => (
                          <td key={`${row.capability}-${index}`} className="px-4 py-5">
                            <span
                              className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-medium ${comparisonToneClass(cell.tone)}`}
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
        </RevealBlock>

        <RevealBlock id="products" className="px-5 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-7xl space-y-10">
            <SectionHeader
              kicker={copy.nav.products}
              title={copy.sections.products}
              description={copy.sections.productsDescription}
            />

            <div className="grid gap-5 lg:grid-cols-2">
              {copy.products.map((product) => (
                <ProductCard key={product.title} product={product} openLabel={copy.labels.openRepo} />
              ))}
            </div>
          </div>
        </RevealBlock>

        <RevealBlock id="stack" className="px-5 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-7xl space-y-10">
            <SectionHeader
              kicker={copy.nav.stack}
              title={copy.sections.stack}
              description={copy.sections.stackDescription}
            />

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {copy.techGroups.map((group) => (
                <TechGroupCard key={group.title} group={group} />
              ))}
            </div>
          </div>
        </RevealBlock>

        <RevealBlock className="px-5 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-7xl space-y-10">
            <SectionHeader
              kicker={copy.labels.poweredBy}
              title={copy.sections.flow}
              description={copy.sections.flowDescription}
            />

            <div className="grid gap-5 lg:grid-cols-2">
              {copy.flowSteps.map((step, index) => (
                <FlowStepCard
                  key={step.title}
                  step={step}
                  icon={flowIcons[index] ?? <Radar size={20} />}
                />
              ))}
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
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rfv-card rounded-[2rem] p-7">
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
                  className="rfv-card rounded-[2rem] p-6 transition-transform duration-200 hover:-translate-y-1"
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
        </RevealBlock>

        <RevealBlock className="px-5 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-7xl space-y-10">
            <SectionHeader kicker={landingUiCopy.faqKicker} title={copy.sections.faq} description={copy.sections.faqDescription} />
            <div className="grid gap-4 lg:grid-cols-2">
              {copy.faq.map((item) => (
                <FaqItem key={item.question} item={item} />
              ))}
            </div>
          </div>
        </RevealBlock>
      </main>

      <footer id="contact" className="border-t border-white/10 px-5 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_auto]">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-accent-blue/25 bg-accent-blue/10">
                <img
                  src={`${import.meta.env.BASE_URL}assets/brand/roboqc-icon-64.png`}
                  alt="RoboQC"
                  className="h-9 w-9"
                />
              </div>
              <div>
                <div className="text-sm font-semibold text-text-primary">RoboQC</div>
                <div className="text-xs uppercase tracking-[0.22em] text-text-muted">
                  {copy.labels.poweredBy}
                </div>
              </div>
            </div>
            <p className="max-w-2xl text-sm leading-7 text-text-secondary">{copy.labels.footerSummary}</p>
            <p className="text-sm text-text-muted">{copy.labels.footerNote}</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <div className="text-xs uppercase tracking-[0.22em] text-text-muted">{copy.nav.contact}</div>
              <div className="mt-4 flex flex-col gap-2 text-sm">
                {navItems.map((item) => (
                  <a key={item.href} href={item.href} className="text-text-secondary transition-colors hover:text-white">
                    {item.label}
                  </a>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.22em] text-text-muted">{landingUiCopy.socialLabel}</div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <a href={brandGuideHref} className="rfv-pill">
                  <ShieldCheck size={16} />
                  {landingUiCopy.brandGuideLabel}
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
        </div>

        <div className="mx-auto mt-8 flex max-w-7xl flex-col gap-3 border-t border-white/[0.08] pt-6 text-xs text-text-muted sm:flex-row sm:items-center sm:justify-between">
          <span>{copy.labels.rights}</span>
          <span className="inline-flex items-center gap-2 self-start rounded-full border border-accent-blue/20 bg-accent-blue/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-blue sm:self-auto">
            <ShieldCheck size={14} />
            {copy.labels.poweredBy}
          </span>
        </div>
      </footer>
    </div>
  );
}


