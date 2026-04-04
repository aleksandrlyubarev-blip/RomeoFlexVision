import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import {
  ArrowRight,
  Bot,
  Cloud,
  Cpu,
  Download,
  ExternalLink,
  Factory,
  Github,
  Layers3,
  Linkedin,
  Menu,
  MessageCircle,
  Sparkles,
  X,
} from 'lucide-react';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { VoiceInterface } from '../components/VoiceInterface';
import { useLanguage } from '../context/LanguageContext';
import { getSiteContent, SITE_LINKS } from '../data/siteContent';
import { submitLeadCapture } from '../lib/leadCapture';

interface LandingProps {
  onPilotLaunch: () => void;
}

function asset(path: string) {
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
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
      <div className="site-kicker">{kicker}</div>
      <h2 className="site-section-title">{title}</h2>
      <p className="text-base leading-8 text-slate-300 sm:text-lg">{description}</p>
    </div>
  );
}

function ProductIcon({ index }: { index: number }) {
  if (index === 0) {
    return <Layers3 size={20} />;
  }

  return <Bot size={20} />;
}

function ProductCard({
  title,
  subtitle,
  description,
  bullets,
  index,
}: {
  title: string;
  subtitle: string;
  description: string;
  bullets: string[];
  index: number;
}) {
  return (
    <article className="site-panel site-product-card rounded-[2rem] p-6 sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.24em] text-cyan-300">{subtitle}</div>
          <h3 className="mt-4 text-2xl font-semibold text-white">{title}</h3>
        </div>
        <div className="site-icon-badge">
          <ProductIcon index={index} />
        </div>
      </div>
      <p className="mt-4 text-sm leading-7 text-slate-300">{description}</p>
      <div className="mt-6 grid gap-3">
        {bullets.map((bullet) => (
          <div key={bullet} className="site-bullet-chip">
            <Sparkles size={14} className="text-yellow-300" />
            <span>{bullet}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

function ProblemCard({ title, description }: { title: string; description: string }) {
  return (
    <article className="site-panel rounded-[1.7rem] p-5">
      <h3 className="text-xl font-semibold text-white">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-300">{description}</p>
    </article>
  );
}

function SolutionStepCard({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <article className="site-panel rounded-[1.6rem] p-5">
      <div className="font-mono text-sm font-semibold tracking-[0.2em] text-cyan-300">{step}</div>
      <h3 className="mt-3 text-xl font-semibold text-white">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-300">{description}</p>
    </article>
  );
}

function TractionCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="site-panel rounded-[1.5rem] p-5">
      <div className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">{value}</div>
      <div className="mt-2 text-sm leading-7 text-slate-300">{label}</div>
    </div>
  );
}

function RoadmapCard({
  phase,
  title,
  description,
}: {
  phase: string;
  title: string;
  description: string;
}) {
  return (
    <article className="site-panel rounded-[1.7rem] p-5">
      <div className="font-mono text-xs uppercase tracking-[0.24em] text-cyan-300">{phase}</div>
      <h3 className="mt-4 text-xl font-semibold text-white">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-300">{description}</p>
    </article>
  );
}

function LinkCard({
  title,
  description,
  href,
  action,
  icon,
}: {
  title: string;
  description: string;
  href: string;
  action: string;
  icon: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="site-panel block rounded-[1.6rem] p-5 transition-transform duration-200 hover:-translate-y-1"
    >
      <div className="flex items-center gap-3">
        <div className="site-icon-badge">{icon}</div>
        <div className="text-lg font-semibold text-white">{title}</div>
      </div>
      <p className="mt-4 text-sm leading-7 text-slate-300">{description}</p>
      <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-cyan-300">
        {action}
        <ExternalLink size={15} />
      </div>
    </a>
  );
}

export default function Landing({ onPilotLaunch }: LandingProps) {
  const { language } = useLanguage();
  const copy = getSiteContent(language);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [formState, setFormState] = useState({
    name: '',
    company: '',
    email: '',
    message: '',
    website: '',
  });
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>(
    'idle'
  );
  const [formFeedback, setFormFeedback] = useState('');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navItems = [
    { label: copy.nav.products, href: '#products' },
    { label: copy.nav.problem, href: '#problem' },
    { label: copy.nav.solution, href: '#solution' },
    { label: copy.nav.traction, href: '#traction' },
    { label: copy.nav.edge, href: '#edge' },
    { label: copy.nav.cloud, href: '#google-cloud' },
    { label: copy.nav.roadmap, href: '#roadmap' },
    { label: copy.nav.team, href: '#team' },
    { label: copy.nav.contact, href: '#contact' },
  ];

  const heroDeckHref = asset(SITE_LINKS.combinedDeck);
  const physicalAiDeckHref = asset(SITE_LINKS.physicalAiDeck);
  const roboqcDeckHref = asset(SITE_LINKS.roboqcDeck);

  const handleFormChange =
    (field: keyof typeof formState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormState((current) => ({
        ...current,
        [field]: event.target.value,
      }));
      if (formStatus !== 'idle') {
        setFormStatus('idle');
        setFormFeedback('');
      }
    };

  const handleLeadSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onPilotLaunch();

    setFormStatus('submitting');
    setFormFeedback('');

    try {
      await submitLeadCapture({
        name: formState.name,
        company: formState.company,
        email: formState.email,
        message: formState.message,
        website: formState.website,
        language,
        pageUrl: window.location.href,
        source: 'romeoflexvision.com',
      });

      setFormState({
        name: '',
        company: '',
        email: '',
        message: '',
        website: '',
      });
      setFormStatus('success');
      setFormFeedback(copy.form.success);
    } catch (error) {
      setFormStatus('error');
      const details = error instanceof Error ? ` ${error.message}` : '';
      setFormFeedback(`${copy.form.error}${details}`);
    }
  };

  return (
    <div className="site-shell min-h-screen overflow-x-hidden bg-[#060b16] text-white">
      <div className="pointer-events-none absolute inset-0 site-grid opacity-80" />
      <div className="pointer-events-none absolute left-[-12rem] top-[-6rem] h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,rgba(66,216,255,0.22),transparent_68%)] blur-3xl" />
      <div className="pointer-events-none absolute right-[-10rem] top-[18rem] h-[24rem] w-[24rem] rounded-full bg-[radial-gradient(circle,rgba(255,220,92,0.18),transparent_68%)] blur-3xl" />

      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled ? 'site-header site-header-scrolled' : 'site-header'
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-5 py-4 sm:px-6 lg:px-8">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-3 text-left"
          >
            <div className="site-wordmark-badge">
              <span className="site-wordmark-rf">RF</span>
              <span className="site-wordmark-eye" aria-hidden="true" />
            </div>
            <div>
              <div className="text-base font-semibold tracking-tight text-white">RomeoFlexVision</div>
              <div className="text-[11px] uppercase tracking-[0.24em] text-slate-400">
                Open Execution Layer for Physical AI
              </div>
            </div>
          </button>

          <nav className="hidden items-center gap-7 lg:ml-10 lg:flex">
            {navItems.map((item) => (
              <a key={item.href} href={item.href} className="site-nav-link text-sm">
                {item.label}
              </a>
            ))}
          </nav>

          <div className="ml-auto hidden items-center gap-3 lg:flex">
            <LanguageSwitcher />
            <a href={heroDeckHref} download className="site-button site-button-ghost px-4 py-2 text-sm">
              {copy.nav.deck}
            </a>
            <a
              href={SITE_LINKS.github}
              target="_blank"
              rel="noreferrer"
              className="site-button site-button-ghost px-4 py-2 text-sm"
            >
              {copy.nav.github}
            </a>
            <button onClick={onPilotLaunch} className="site-button site-button-primary px-4 py-2 text-sm">
              {copy.nav.pilot}
            </button>
          </div>

          <div className="ml-auto flex items-center gap-2 lg:hidden">
            <LanguageSwitcher />
            <button
              onClick={() => setMobileMenuOpen((current) => !current)}
              className="site-mobile-toggle"
              aria-label={mobileMenuOpen ? copy.nav.close : copy.nav.menu}
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="site-mobile-panel px-5 py-5 lg:hidden">
            <div className="flex flex-col gap-3">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="site-mobile-link"
                >
                  {item.label}
                </a>
              ))}
              <a href={heroDeckHref} download className="site-button site-button-ghost text-center text-sm">
                {copy.nav.deck}
              </a>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onPilotLaunch();
                }}
                className="site-button site-button-primary text-sm"
              >
                {copy.nav.pilot}
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="relative z-10">
        <section className="px-5 pb-16 pt-12 sm:px-6 lg:px-8 lg:pb-24 lg:pt-16">
          <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-8">
              <div className="site-kicker">{copy.hero.eyebrow}</div>

              <div className="space-y-5">
                <h1 className="max-w-4xl text-balance text-5xl font-semibold leading-[0.94] tracking-tight text-white sm:text-6xl lg:text-7xl">
                  {copy.hero.title}
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
                  {copy.hero.subtitle}
                </p>
              </div>

              <div className="site-hero-slogan">
                <div className="text-xs uppercase tracking-[0.24em] text-cyan-300">
                  {copy.hero.sloganLabel}
                </div>
                <div className="mt-3 text-lg font-medium leading-8 text-white">{copy.hero.slogan}</div>
              </div>

              <div className="flex flex-wrap gap-3">
                <a
                  href={heroDeckHref}
                  download
                  className="site-button site-button-primary inline-flex items-center gap-2 px-6 py-3 text-sm sm:text-base"
                >
                  <Download size={16} />
                  {copy.hero.primaryCta}
                </a>
                <a
                  href="#contact"
                  className="site-button site-button-secondary inline-flex items-center gap-2 px-6 py-3 text-sm sm:text-base"
                >
                  {copy.hero.secondaryCta}
                  <ArrowRight size={16} />
                </a>
                <a
                  href="#google-cloud"
                  className="site-button site-button-ghost inline-flex items-center gap-2 px-6 py-3 text-sm sm:text-base"
                >
                  <Cloud size={16} />
                  {copy.hero.tertiaryCta}
                </a>
              </div>

              <div className="flex flex-wrap gap-3">
                {copy.hero.chips.map((chip) => (
                  <span key={chip} className="site-chip">
                    {chip}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                <span className="site-partner-chip">NVIDIA Inception</span>
                <span className="site-partner-chip">Google Cloud</span>
                <span className="site-partner-chip">Q2 2026 pilots</span>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[640px]">
              <div className="site-hero-visual">
                <img
                  src={asset('/assets/brand/romeo-photo.jpg')}
                  alt="Industrial robot inspection scene"
                  className="site-hero-photo"
                />

                <div className="site-hero-card site-hero-card-left">
                  <img
                    src={asset('/assets/decks/rfv-cover.png')}
                    alt="RomeoFlexVision deck cover"
                    className="site-hero-thumb"
                  />
                </div>

                <div className="site-hero-card site-hero-card-right">
                  <img
                    src={asset('/assets/decks/roboqc-cover.png')}
                    alt="RoboQC deck cover"
                    className="site-hero-thumb"
                  />
                </div>

                <div className="site-hero-overlay">
                  <div className="site-hero-overlay-card">
                    <div className="site-kicker">{copy.heroVisual.headline}</div>
                    <div className="mt-4 text-xl font-semibold text-white">{copy.heroVisual.subline}</div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="site-hero-mini-card">{copy.heroVisual.cardA}</div>
                    <div className="site-hero-mini-card">{copy.heroVisual.cardB}</div>
                    <div className="site-hero-mini-card">{copy.heroVisual.cardC}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <RevealBlock id="products" className="px-5 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-7xl space-y-10">
            <SectionHeader
              kicker={copy.products.kicker}
              title={copy.products.title}
              description={copy.products.description}
            />

            <div className="grid gap-5 lg:grid-cols-2">
              {copy.products.items.map((item, index) => (
                <ProductCard
                  key={item.name}
                  title={item.name}
                  subtitle={item.subtitle}
                  description={item.description}
                  bullets={item.bullets}
                  index={index}
                />
              ))}
            </div>
          </div>
        </RevealBlock>

        <RevealBlock id="problem" className="px-5 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.94fr_1.06fr]">
            <div className="space-y-6">
              <SectionHeader
                kicker={copy.problem.kicker}
                title={copy.problem.title}
                description={copy.problem.description}
              />
              <div className="grid gap-4">
                {copy.problem.items.map((item) => (
                  <ProblemCard key={item.title} title={item.title} description={item.description} />
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="site-image-shell">
                <div className="site-image-caption">{copy.ui.problemVisualLabel}</div>
                <img
                  src={asset('/assets/decks/roboqc-cost-explosion.png')}
                  alt="Cost explosion across assembly stations"
                  className="site-section-image"
                />
              </div>
              <div className="site-image-shell">
                <div className="site-image-caption">Old way vs RoboQC</div>
                <img
                  src={asset('/assets/decks/roboqc-old-vs-new.png')}
                  alt="Old reactive QA versus RoboQC inline prevention"
                  className="site-section-image"
                />
              </div>
            </div>
          </div>
        </RevealBlock>

        <RevealBlock id="solution" className="px-5 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-7xl space-y-10">
            <SectionHeader
              kicker={copy.solution.kicker}
              title={copy.solution.title}
              description={copy.solution.description}
            />

            <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="grid gap-4 md:grid-cols-2">
                {copy.solution.steps.map((step) => (
                  <SolutionStepCard
                    key={step.step}
                    step={step.step}
                    title={step.title}
                    description={step.description}
                  />
                ))}

                <div className="site-panel rounded-[1.8rem] p-6 md:col-span-2">
                  <div className="site-kicker">{copy.solution.semanticTitle}</div>
                  <p className="mt-4 text-sm leading-8 text-slate-300">
                    {copy.solution.semanticDescription}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="site-image-shell">
                  <div className="site-image-caption">{copy.ui.solutionVisualLabel}</div>
                  <img
                    src={asset('/assets/decks/rfv-import-to-action.png')}
                    alt="Import to action workflow"
                    className="site-section-image"
                  />
                </div>
                <div className="site-image-shell">
                  <div className="site-image-caption">{copy.solution.semanticTitle}</div>
                  <img
                    src={asset('/assets/decks/roboqc-semantic-conflict.png')}
                    alt="Semantic conflict resolution diagram"
                    className="site-section-image"
                  />
                </div>
              </div>
            </div>
          </div>
        </RevealBlock>

        <RevealBlock id="traction" className="px-5 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.96fr_1.04fr]">
            <div className="space-y-6">
              <SectionHeader
                kicker={copy.traction.kicker}
                title={copy.traction.title}
                description={copy.traction.description}
              />
              <div className="site-panel rounded-[1.8rem] p-6">
                <div className="text-xs uppercase tracking-[0.24em] text-cyan-300">
                  {copy.ui.partnersLabel}
                </div>
                <div className="mt-4 text-2xl font-semibold leading-tight text-white">
                  {copy.ui.tractionNote}
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <span className="site-partner-chip">NVIDIA Inception</span>
                  <span className="site-partner-chip">5 pilot factories</span>
                  <span className="site-partner-chip">100+ investigations</span>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {copy.traction.stats.map((item) => (
                <TractionCard key={`${item.value}-${item.label}`} value={item.value} label={item.label} />
              ))}
              <div className="site-image-shell md:col-span-2">
                <img
                  src={asset('/assets/decks/roboqc-window.png')}
                  alt="RoboQC market window diagram"
                  className="site-section-image"
                />
              </div>
            </div>
          </div>
        </RevealBlock>

        <RevealBlock id="edge" className="px-5 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.96fr_1.04fr]">
            <div className="space-y-6">
              <SectionHeader
                kicker={copy.edge.kicker}
                title={copy.edge.title}
                description={copy.edge.description}
              />
              <div className="grid gap-3">
                {copy.edge.bullets.map((bullet) => (
                  <div key={bullet} className="site-bullet-row">
                    <Cpu size={16} className="text-cyan-300" />
                    <span>{bullet}</span>
                  </div>
                ))}
              </div>
              <div className="site-panel rounded-[1.6rem] p-5 text-sm leading-7 text-slate-300">
                {copy.edge.footer}
              </div>
            </div>

            <div className="space-y-4">
              <div className="site-image-shell">
                <img
                  src={asset('/assets/decks/roboqc-tech-edge.png')}
                  alt="RoboQC edge stack diagram"
                  className="site-section-image"
                />
              </div>
              <div className="site-image-shell">
                <img
                  src={asset('/assets/decks/rfv-moat-matrix.png')}
                  alt="Architectural defensibility matrix"
                  className="site-section-image"
                />
              </div>
            </div>
          </div>
        </RevealBlock>

        <RevealBlock id="google-cloud" className="px-5 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.98fr_1.02fr]">
            <div className="space-y-6">
              <SectionHeader
                kicker={copy.cloud.kicker}
                title={copy.cloud.title}
                description={copy.cloud.description}
              />
              <div className="grid gap-3">
                {copy.cloud.bullets.map((bullet) => (
                  <div key={bullet} className="site-bullet-row">
                    <Cloud size={16} className="text-cyan-300" />
                    <span>{bullet}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="site-image-shell">
                <div className="site-image-caption">Neutral bridge</div>
                <img
                  src={asset('/assets/decks/rfv-neutral-bridge.png')}
                  alt="RomeoFlexVision neutral bridge diagram"
                  className="site-section-image"
                />
              </div>
              <div className="site-image-shell">
                <div className="site-image-caption">Wedge market</div>
                <img
                  src={asset('/assets/decks/roboqc-wedge.png')}
                  alt="RoboQC wedge market expansion"
                  className="site-section-image"
                />
              </div>
            </div>
          </div>
        </RevealBlock>

        <RevealBlock id="roadmap" className="px-5 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-7xl space-y-10">
            <SectionHeader
              kicker={copy.roadmap.kicker}
              title={copy.roadmap.title}
              description={copy.roadmap.description}
            />

            <div className="grid gap-8 lg:grid-cols-[1.04fr_0.96fr]">
              <div className="grid gap-4 md:grid-cols-2">
                {copy.roadmap.items.map((item) => (
                  <RoadmapCard
                    key={`${item.phase}-${item.title}`}
                    phase={item.phase}
                    title={item.title}
                    description={item.description}
                  />
                ))}
                <div className="site-panel rounded-[1.8rem] p-6 md:col-span-2">
                  <div className="site-kicker">{copy.ui.thinkPadLabel}</div>
                  <p className="mt-4 text-sm leading-8 text-slate-300">{copy.ui.thinkPadDescription}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="site-image-shell">
                  <img
                    src={asset('/assets/decks/roboqc-moat.png')}
                    alt="RomeoFlexVision open source core moat"
                    className="site-section-image"
                  />
                </div>
              </div>
            </div>
          </div>
        </RevealBlock>

        <RevealBlock id="team" className="px-5 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.98fr_1.02fr]">
            <div className="space-y-6">
              <SectionHeader
                kicker={copy.team.kicker}
                title={copy.team.title}
                description={copy.team.description}
              />
              <div className="site-panel rounded-[2rem] p-6 sm:p-7">
                <div className="flex items-start gap-4">
                  <div className="site-founder-orb">
                    <span>AL</span>
                  </div>
                  <div>
                    <div className="site-kicker">{copy.ui.teamBadge}</div>
                    <h3 className="mt-4 text-2xl font-semibold text-white">{copy.team.leaderName}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-300">{copy.team.leaderRole}</p>
                  </div>
                </div>
                <div className="mt-6 grid gap-3">
                  {copy.team.expertise.map((item) => (
                    <div key={item} className="site-bullet-row">
                      <Factory size={16} className="text-yellow-300" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="site-image-shell">
              <img
                src={asset('/assets/decks/rfv-cover.png')}
                alt="RomeoFlexVision physical AI deck cover"
                className="site-section-image"
              />
            </div>
          </div>
        </RevealBlock>
      </main>

      <footer id="contact" className="px-5 pb-16 pt-14 sm:px-6 lg:px-8 lg:pb-20">
        <div className="mx-auto max-w-7xl">
          <div className="site-panel rounded-[2rem] p-6 sm:p-8 lg:p-10">
            <div className="grid gap-8 lg:grid-cols-[1.02fr_0.98fr]">
              <div className="space-y-6">
                <SectionHeader
                  kicker={copy.nav.contact}
                  title={copy.form.title}
                  description={copy.form.description}
                />

                <form onSubmit={handleLeadSubmit} className="grid gap-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="site-field">
                      <span>{copy.form.nameLabel}</span>
                      <input
                        value={formState.name}
                        onChange={handleFormChange('name')}
                        autoComplete="name"
                        required
                      />
                    </label>
                    <label className="site-field">
                      <span>{copy.form.companyLabel}</span>
                      <input
                        value={formState.company}
                        onChange={handleFormChange('company')}
                        autoComplete="organization"
                      />
                    </label>
                  </div>

                  <label className="site-field">
                    <span>{copy.form.emailLabel}</span>
                    <input
                      value={formState.email}
                      onChange={handleFormChange('email')}
                      type="email"
                      autoComplete="email"
                      required
                    />
                  </label>

                  <label className="site-field">
                    <span>{copy.form.messageLabel}</span>
                    <textarea
                      value={formState.message}
                      onChange={handleFormChange('message')}
                      rows={5}
                      required
                    />
                  </label>

                  <input
                    tabIndex={-1}
                    autoComplete="off"
                    className="hidden"
                    aria-hidden="true"
                    value={formState.website}
                    onChange={handleFormChange('website')}
                  />

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm leading-7 text-slate-400">{copy.form.helper}</div>
                    <button
                      type="submit"
                      disabled={formStatus === 'submitting'}
                      className="site-button site-button-primary inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      <MessageCircle size={16} />
                      {formStatus === 'submitting' ? copy.form.submittingLabel : copy.form.submitLabel}
                    </button>
                  </div>

                  {formStatus !== 'idle' && formStatus !== 'submitting' && (
                    <div className="rounded-[1.2rem] border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
                      {formFeedback}
                    </div>
                  )}
                </form>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="site-kicker">{copy.ui.downloadsLabel}</div>
                  <div className="mt-5 grid gap-4">
                    {copy.downloads.map((item) => (
                      <a
                        key={item.title}
                        href={asset(item.href)}
                        download
                        className="site-panel block rounded-[1.5rem] p-5 transition-transform duration-200 hover:-translate-y-1"
                      >
                        <div className="flex items-center gap-3">
                          <div className="site-icon-badge">
                            <Download size={18} />
                          </div>
                          <div className="text-lg font-semibold text-white">{item.title}</div>
                        </div>
                        <p className="mt-3 text-sm leading-7 text-slate-300">{item.description}</p>
                        <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-cyan-300">
                          {copy.nav.deck}
                          <ArrowRight size={15} />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="site-kicker">{copy.ui.contactLinksLabel}</div>
                  <div className="mt-5 grid gap-4">
                    {copy.contactMethods.map((item) => (
                      <LinkCard
                        key={item.title}
                        title={item.title}
                        description={item.description}
                        href={item.href}
                        action={item.action}
                        icon={
                          item.title.includes('GitHub') ? (
                            <Github size={18} />
                          ) : item.title.includes('LinkedIn') ? (
                            <Linkedin size={18} />
                          ) : (
                            <Bot size={18} />
                          )
                        }
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <span>2026 RomeoFlexVision / RoboQC. Physical AI landing.</span>
              <div className="flex flex-wrap items-center gap-3">
                <a href={physicalAiDeckHref} download className="site-footer-link">
                  RFV deck
                </a>
                <a href={roboqcDeckHref} download className="site-footer-link">
                  RoboQC deck
                </a>
                <a href={SITE_LINKS.telegram} target="_blank" rel="noreferrer" className="site-footer-link">
                  {SITE_LINKS.telegramHandle}
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <VoiceInterface />
    </div>
  );
}
