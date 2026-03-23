import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Github,
  Linkedin,
  Menu,
  MessageCircle,
  Sparkles,
  Workflow,
  X,
} from 'lucide-react';
import AgentAvatar from '../components/AgentAvatar';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useLanguage } from '../context/LanguageContext';
import { getAgents } from '../data/agents';
import { getSiteContent, SITE_LINKS, type SiteFaqItem, type SiteProduct } from '../data/siteContent';
import type { View } from '../types';

interface LandingProps {
  onNavigate: (view: View) => void;
  onLogin: () => void;
  onRegister: () => void;
  onSignOut: () => void;
  isAuthenticated: boolean;
}

function useCountUp(target: number, duration = 1400) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let animationId = 0;
    let frame = 0;
    const started = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - started) / duration, 1);
      const next = Math.round(target * progress);
      if (next !== frame) {
        frame = next;
        setValue(next);
      }
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
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.16 }
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
    <div className="rfv-card rounded-2xl p-4 sm:p-5">
      <div className="font-mono text-3xl font-semibold text-text-primary sm:text-4xl">
        {count.toLocaleString()}
        <span className="text-accent-blue">{suffix}</span>
      </div>
      <div className="mt-2 text-sm text-text-secondary">{label}</div>
    </div>
  );
}

function ProductCard({
  product,
  icon,
  color,
  subtitle,
  openLabel,
}: {
  product: SiteProduct;
  icon: string;
  color: string;
  subtitle: string;
  openLabel: string;
}) {
  const statusTone =
    product.statusTone === 'success'
      ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
      : product.statusTone === 'warning'
        ? 'border-amber-400/30 bg-amber-400/10 text-amber-200'
        : 'border-sky-400/30 bg-sky-400/10 text-sky-200';

  return (
    <article className="rfv-card group relative overflow-hidden rounded-3xl p-6">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-blue/80 to-transparent opacity-70" />
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <AgentAvatar color={color} icon={icon} status="ready" size="sm" animate={false} />
          <div>
            <div className="text-xs uppercase tracking-[0.24em] text-text-muted">{product.eyebrow}</div>
            <h3 className="mt-1 text-xl font-semibold text-text-primary">{product.title}</h3>
            <div className="text-sm text-text-secondary">{subtitle}</div>
          </div>
        </div>
        <span className={`rounded-full border px-3 py-1 text-[11px] font-medium ${statusTone}`}>
          {product.status}
        </span>
      </div>

      <p className="mt-5 text-sm leading-7 text-text-secondary">{product.description}</p>

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

function TechMarquee({ groups }: { groups: Array<{ title: string; items: string[] }> }) {
  const rows = [...groups, ...groups];

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02]">
      <div className="rfv-marquee flex w-max gap-4 py-4">
        {rows.map((group, index) => (
          <div key={`${group.title}-${index}`} className="rfv-card min-w-[240px] rounded-2xl p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
              <Workflow size={16} className="text-accent-blue" />
              {group.title}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {group.items.map((item) => (
                <span key={item} className="rfv-pill">
                  {item}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FaqItem({ item }: { item: SiteFaqItem }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rfv-card rounded-2xl p-5">
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

function LandingVisual({
  products,
  orbitTitle,
  orbitCaption,
  centralNode,
}: {
  products: Array<{ id: string; title: string; icon: string; color: string; subtitle: string }>;
  orbitTitle: string;
  orbitCaption: string;
  centralNode: string;
}) {
  const positions = ['left-0 top-10', 'right-0 top-14', 'left-10 bottom-0', 'right-8 bottom-6'];

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[520px]">
      <div className="absolute inset-6 rounded-full border border-accent-blue/20" />
      <div className="absolute inset-16 rounded-full border border-accent-purple/20" />
      <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_50%,rgba(0,212,255,0.16),transparent_62%)]" />

      <div className="absolute left-1/2 top-1/2 z-20 flex w-44 -translate-x-1/2 -translate-y-1/2 flex-col items-center rounded-3xl border border-white/10 bg-[#0f1326]/85 px-5 py-5 text-center shadow-[0_0_80px_rgba(0,212,255,0.12)] backdrop-blur-xl">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-blue/30 to-accent-purple/30 text-accent-blue">
          <Sparkles size={22} />
        </div>
        <div className="mt-4 text-sm uppercase tracking-[0.24em] text-text-muted">{centralNode}</div>
        <div className="mt-1 text-lg font-semibold text-text-primary">{orbitTitle}</div>
        <p className="mt-2 text-xs leading-6 text-text-secondary">{orbitCaption}</p>
      </div>

      {products.map((product, index) => (
        <div key={product.id} className={`absolute z-10 ${positions[index]}`}>
          <div className="rfv-card flex w-44 items-center gap-3 rounded-2xl px-4 py-3">
            <AgentAvatar color={product.color} icon={product.icon} status="ready" size="sm" />
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-text-primary">{product.title}</div>
              <div className="truncate text-xs text-text-muted">{product.subtitle}</div>
            </div>
          </div>
        </div>
      ))}

      <div className="absolute left-[22%] top-[28%] h-px w-[28%] bg-gradient-to-r from-accent-blue/0 via-accent-blue/70 to-accent-blue/0" />
      <div className="absolute right-[22%] top-[30%] h-px w-[24%] bg-gradient-to-r from-accent-purple/0 via-accent-purple/70 to-accent-purple/0" />
      <div className="absolute bottom-[24%] left-[26%] h-px w-[24%] rotate-[25deg] bg-gradient-to-r from-accent-blue/0 via-accent-blue/70 to-accent-blue/0" />
      <div className="absolute bottom-[26%] right-[24%] h-px w-[22%] -rotate-[25deg] bg-gradient-to-r from-accent-purple/0 via-accent-purple/70 to-accent-purple/0" />
    </div>
  );
}

export default function Landing({
  onNavigate,
  onLogin,
  onRegister,
  onSignOut,
  isAuthenticated,
}: LandingProps) {
  const { language } = useLanguage();
  const copy = getSiteContent(language);
  const agents = useMemo(() => getAgents(language), [language]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const featuredAgents = useMemo(
    () =>
      copy.products.map((product) => {
        const agent = agents.find((item) => item.id === product.id);
        return {
          ...product,
          icon: agent?.icon ?? 'shell',
          color: agent?.color ?? '#00d4ff',
          subtitle: product.eyebrow,
        };
      }),
    [agents, copy.products]
  );

  const navItems = [
    { label: copy.nav.ecosystem, href: '#ecosystem' },
    { label: copy.nav.products, href: '#products' },
    { label: copy.nav.stack, href: '#stack' },
    { label: copy.nav.roadmap, href: '#roadmap' },
    { label: copy.nav.contact, href: '#contact' },
  ];

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0a0a1a] text-text-primary">
      <div className="pointer-events-none absolute inset-0 rfv-grid opacity-50" />
      <div className="absolute left-1/2 top-0 h-[38rem] w-[38rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(0,212,255,0.18),transparent_58%)] blur-3xl" />
      <div className="absolute right-[-8rem] top-[16rem] h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.18),transparent_60%)] blur-3xl" />

      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled ? 'border-b border-white/10 bg-[#0a0a1a]/80 backdrop-blur-xl' : 'bg-transparent'
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-5 py-4 sm:px-6 lg:px-8">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-3"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-accent-blue/30 bg-accent-blue/10 shadow-[0_0_24px_rgba(0,212,255,0.16)]">
              <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="RomeoFlexVision" className="h-6 w-6" />
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold tracking-wide text-text-primary">
                Romeo<span className="text-accent-blue">Flex</span>Vision
              </div>
              <div className="text-[11px] uppercase tracking-[0.22em] text-text-muted">
                Agentic AI ecosystem
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
            {isAuthenticated ? (
              <>
                <button onClick={() => onNavigate('catalog')} className="btn-primary px-4 py-2 text-sm">
                  {copy.nav.openPlatform}
                </button>
                <button onClick={onSignOut} className="btn-ghost px-4 py-2 text-sm">
                  {copy.nav.signOut}
                </button>
              </>
            ) : (
              <>
                <button onClick={onLogin} className="btn-ghost px-4 py-2 text-sm">
                  {copy.nav.signIn}
                </button>
                <button onClick={onRegister} className="btn-primary px-4 py-2 text-sm">
                  {copy.nav.openPlatform}
                </button>
              </>
            )}
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
          <div className="border-t border-white/10 bg-[#0a0a1a]/95 px-5 py-5 backdrop-blur-xl lg:hidden">
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
              <div className="grid grid-cols-2 gap-3 pt-2">
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
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (isAuthenticated) {
                    onNavigate('catalog');
                  } else {
                    onLogin();
                  }
                }}
                className="btn-primary mt-2 text-sm"
              >
                {isAuthenticated ? copy.nav.openPlatform : copy.nav.signIn}
              </button>
            </div>
          </div>
        )}
      </header>

      <main>
        <section className="relative px-5 pb-16 pt-14 sm:px-6 lg:px-8 lg:pb-24 lg:pt-20">
          <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.15fr_0.85fr]">
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
                <a href="#products" className="btn-primary inline-flex items-center gap-2 px-6 py-3 text-sm sm:text-base">
                  {copy.hero.primaryCta}
                  <ArrowRight size={16} />
                </a>
                <a
                  href={SITE_LINKS.github}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-ghost inline-flex items-center gap-2 border border-white/10 px-6 py-3 text-sm sm:text-base"
                >
                  {copy.hero.secondaryCta}
                  <Github size={16} />
                </a>
                <button
                  onClick={() => onNavigate('catalog')}
                  className="btn-ghost inline-flex items-center gap-2 border border-white/10 px-6 py-3 text-sm sm:text-base"
                >
                  {copy.hero.tertiaryCta}
                  <ArrowRight size={16} />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm text-text-secondary">
                <span className="rfv-pill">Bot entry point</span>
                <a
                  href={SITE_LINKS.telegram}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 font-medium text-accent-blue transition-colors hover:text-white"
                >
                  {SITE_LINKS.telegramHandle}
                  <ArrowRight size={15} />
                </a>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {copy.metrics.map((metric) => (
                  <MetricCard key={metric.label} {...metric} />
                ))}
              </div>
            </div>

            <LandingVisual
              products={featuredAgents}
              orbitTitle={copy.hero.orbitTitle}
              orbitCaption={copy.hero.orbitCaption}
              centralNode={copy.labels.centralNode}
            />
          </div>
        </section>

        <RevealBlock id="ecosystem" className="px-5 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-7xl space-y-10">
            <SectionHeader
              kicker={copy.nav.ecosystem}
              title={copy.sections.ecosystem}
              description={copy.sections.ecosystemDescription}
            />

            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rfv-card rounded-3xl p-6 sm:p-8">
                <div className="text-xs uppercase tracking-[0.22em] text-text-muted">ROMA orchestrator</div>
                <div className="mt-4 rounded-3xl border border-white/[0.08] bg-[#0e1224] p-6">
                  <div className="flex items-center justify-between gap-4 rounded-2xl border border-accent-blue/20 bg-accent-blue/[0.08] px-5 py-4">
                    <div>
                      <div className="text-sm uppercase tracking-[0.24em] text-text-muted">
                        {copy.labels.centralNode}
                      </div>
                      <div className="mt-1 text-2xl font-semibold text-text-primary">ROMA</div>
                    </div>
                    <div className="rounded-full border border-accent-purple/30 bg-accent-purple/10 px-4 py-2 text-sm text-accent-purple">
                      LangGraph · LiteLLM · Moltis
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    {featuredAgents.map((product) => (
                      <div key={product.id} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
                        <div className="flex items-center gap-3">
                          <AgentAvatar color={product.color} icon={product.icon} status="ready" size="sm" />
                          <div>
                            <div className="text-sm font-medium text-text-primary">{product.title}</div>
                            <div className="text-xs text-text-muted">{product.subtitle}</div>
                          </div>
                        </div>
                        <div className="mt-3 text-sm leading-6 text-text-secondary">{product.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
                {copy.ecosystemCards.map((card) => (
                  <div key={card.title} className="rfv-card rounded-3xl p-6">
                    <div className="text-sm uppercase tracking-[0.24em] text-text-muted">{card.title}</div>
                    <p className="mt-3 text-base leading-7 text-text-secondary">{card.description}</p>
                  </div>
                ))}
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
              {featuredAgents.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  icon={product.icon}
                  color={product.color}
                  subtitle={product.subtitle}
                  openLabel={copy.nav.openRepo}
                />
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
            <TechMarquee groups={copy.techGroups} />
          </div>
        </RevealBlock>

        <RevealBlock className="px-5 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-7xl space-y-10">
            <SectionHeader
              kicker="Andrew Swarm"
              title={copy.sections.architecture}
              description={copy.sections.architectureDescription}
            />

            <div className="rfv-card overflow-hidden rounded-3xl p-6 sm:p-8">
              <div className="grid gap-4 lg:grid-cols-6">
                {copy.architectureSteps.map((step, index) => (
                  <div key={step} className="relative rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
                    <div className="text-[11px] uppercase tracking-[0.22em] text-text-muted">
                      {copy.labels.roadmapStep} {index + 1}
                    </div>
                    <div className="mt-2 text-sm font-medium text-text-primary">{step}</div>
                    {index < copy.architectureSteps.length - 1 && (
                      <div className="pointer-events-none absolute -right-3 top-1/2 hidden h-px w-6 -translate-y-1/2 bg-gradient-to-r from-accent-blue to-accent-purple lg:block" />
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {copy.architectureLanes.map((item) => (
                  <div key={item} className="rfv-pill justify-center py-2 text-center text-sm">
                    {item}
                  </div>
                ))}
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
            <div className="grid gap-5 lg:grid-cols-2">
              {copy.roadmap.map((item, index) => {
                const tone =
                  item.statusTone === 'success'
                    ? 'border-emerald-400/25 bg-emerald-400/[0.08] text-emerald-200'
                    : item.statusTone === 'warning'
                      ? 'border-amber-400/25 bg-amber-400/[0.08] text-amber-200'
                      : 'border-white/10 bg-white/5 text-text-secondary';

                return (
                  <div key={`${item.phase}-${index}`} className="rfv-card relative rounded-3xl p-6">
                    <div className="absolute left-6 top-0 h-full w-px bg-gradient-to-b from-accent-blue/70 via-accent-purple/40 to-transparent" />
                    <div className="ml-6">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-xs uppercase tracking-[0.22em] text-text-muted">{item.phase}</span>
                        <span className={`rounded-full border px-3 py-1 text-[11px] font-medium ${tone}`}>
                          {item.status}
                        </span>
                      </div>
                      <h3 className="mt-4 text-xl font-semibold text-text-primary">{item.title}</h3>
                      <p className="mt-3 text-sm leading-7 text-text-secondary">{item.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </RevealBlock>

        <RevealBlock className="px-5 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rfv-card rounded-3xl p-6 sm:p-8">
              <SectionHeader
                kicker="Investors"
                title={copy.sections.investors}
                description={copy.sections.investorsDescription}
              />
              <div className="mt-8 space-y-4">
                {copy.investorBullets.map((bullet) => (
                  <div key={bullet} className="flex gap-3 text-sm leading-7 text-text-secondary">
                    <span className="mt-2 h-2 w-2 rounded-full bg-accent-blue" />
                    <span>{bullet}</span>
                  </div>
                ))}
              </div>
              <a
                href={SITE_LINKS.telegram}
                target="_blank"
                rel="noreferrer"
                className="btn-primary mt-8 inline-flex items-center gap-2 px-5 py-3 text-sm"
              >
                <MessageCircle size={16} />
                {copy.labels.investorCta}
              </a>
            </div>

            <div className="space-y-5">
              <SectionHeader
                kicker={copy.nav.contact}
                title={copy.sections.community}
                description={copy.sections.communityDescription}
              />
              <div className="grid gap-4">
                {copy.communityCards.map((card) => (
                  <a
                    key={card.title}
                    href={card.href}
                    target="_blank"
                    rel="noreferrer"
                    className="rfv-card rounded-3xl p-6 transition-transform duration-200 hover:-translate-y-1"
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
        </RevealBlock>

        <RevealBlock className="px-5 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-7xl space-y-10">
            <SectionHeader
              kicker="FAQ"
              title={copy.sections.faq}
              description={copy.sections.faqDescription}
            />
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
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-accent-blue/30 bg-accent-blue/10">
                <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="RomeoFlexVision" className="h-6 w-6" />
              </div>
              <div>
                <div className="text-sm font-semibold text-text-primary">
                  Romeo<span className="text-accent-blue">Flex</span>Vision
                </div>
                <div className="text-xs uppercase tracking-[0.22em] text-text-muted">
                  {copy.labels.builtWith}
                </div>
              </div>
            </div>
            <p className="max-w-2xl text-sm leading-7 text-text-secondary">{copy.labels.footerSummary}</p>
            <p className="text-sm text-text-muted">{copy.labels.footerStack}</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <div className="text-xs uppercase tracking-[0.22em] text-text-muted">{copy.nav.quickLinks}</div>
              <div className="mt-4 flex flex-col gap-2 text-sm">
                {navItems.map((item) => (
                  <a key={item.href} href={item.href} className="text-text-secondary transition-colors hover:text-white">
                    {item.label}
                  </a>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.22em] text-text-muted">{copy.nav.social}</div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
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

        <div className="mx-auto mt-8 flex max-w-7xl flex-col gap-2 border-t border-white/[0.08] pt-6 text-xs text-text-muted sm:flex-row sm:items-center sm:justify-between">
          <span>{copy.labels.rights}</span>
          <span>Built with Claude + LangGraph + FastAPI + React</span>
        </div>
      </footer>
    </div>
  );
}
