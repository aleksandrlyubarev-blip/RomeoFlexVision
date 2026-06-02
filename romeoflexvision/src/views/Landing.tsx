import { Bot, Github, Hand, MessageCircle, Monitor, ShieldCheck } from 'lucide-react';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useLanguage } from '../context/LanguageContext';
import { getSiteContent, SITE_LINKS } from '../data/siteContent';

const ENTITY_ICONS = [Bot, Monitor, Hand, ShieldCheck] as const;

export default function Landing({ onContactLaunch }: { onContactLaunch: () => void }) {
  const { language } = useLanguage();
  const copy = getSiteContent(language);

  return (
    <div className="site-shell min-h-screen overflow-hidden">
      <div className="site-grid pointer-events-none fixed inset-0 -z-10 opacity-70" />

      <header className="site-header sticky top-0 z-20 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <a href="#overview" className="flex items-center gap-3">
            <span className="site-wordmark-eye" aria-hidden="true" />
            <span className="font-semibold tracking-tight text-white">RomeoFlexVision</span>
          </a>
          <nav className="hidden items-center gap-5 text-sm md:flex">
            <a href="#overview" className="site-nav-link">{copy.nav.overview}</a>
            <a href="#entities" className="site-nav-link">{copy.nav.entities}</a>
            <a href="#boundary" className="site-nav-link">{copy.nav.boundary}</a>
            <a href={SITE_LINKS.github} className="site-nav-link" target="_blank" rel="noreferrer">
              {copy.nav.github}
            </a>
          </nav>
          <LanguageSwitcher />
        </div>
      </header>

      <main>
        <section id="overview" className="mx-auto max-w-6xl px-5 py-24 sm:py-32">
          <div className="max-w-4xl">
            <span className="site-kicker">{copy.hero.eyebrow}</span>
            <h1 className="mt-7 text-balance text-5xl font-semibold leading-[0.96] tracking-tight text-white sm:text-7xl">
              {copy.hero.title}
            </h1>
            <p className="mt-7 max-w-3xl text-lg leading-8 text-slate-300">{copy.hero.description}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a
                href={SITE_LINKS.github}
                target="_blank"
                rel="noreferrer"
                className="site-button site-button-primary gap-2 px-5 py-3"
              >
                <Github size={18} />
                {copy.hero.primaryCta}
              </a>
              <button
                type="button"
                onClick={onContactLaunch}
                className="site-button site-button-secondary gap-2 px-5 py-3"
              >
                <MessageCircle size={18} />
                {copy.hero.secondaryCta}
              </button>
            </div>
          </div>
        </section>

        <section id="entities" className="mx-auto max-w-6xl px-5 py-20">
          <span className="site-kicker">{copy.entities.kicker}</span>
          <h2 className="site-section-title mt-6">{copy.entities.title}</h2>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">{copy.entities.description}</p>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {copy.entities.items.map((entity, index) => {
              const Icon = ENTITY_ICONS[index];
              return (
                <article key={entity.name} className="site-panel rounded-3xl p-6">
                  <Icon className="text-cyan-300" size={26} />
                  <p className="mt-5 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
                    {entity.kind}
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-white">{entity.name}</h3>
                  <p className="mt-3 leading-7 text-slate-300">{entity.description}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section id="boundary" className="mx-auto max-w-6xl px-5 py-20">
          <div className="site-panel rounded-3xl p-7 sm:p-10">
            <span className="site-kicker">{copy.boundary.kicker}</span>
            <h2 className="site-section-title mt-6">{copy.boundary.title}</h2>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">{copy.boundary.description}</p>
            <ul className="mt-8 grid gap-3 md:grid-cols-2">
              {copy.boundary.bullets.map((bullet) => (
                <li key={bullet} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-200">
                  {bullet}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-8 text-sm text-slate-400">
          <span>2026 RomeoFlexVision. {copy.footer}</span>
          <a href={SITE_LINKS.telegram} target="_blank" rel="noreferrer" className="site-footer-link">
            {SITE_LINKS.telegramHandle}
          </a>
        </div>
      </footer>
    </div>
  );
}
