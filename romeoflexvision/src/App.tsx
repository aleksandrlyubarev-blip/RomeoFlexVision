import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { type Language, LanguageProvider, useLanguage } from './context/LanguageContext';
import AuthModal from './components/AuthModal';
import LanguageSwitcher from './components/LanguageSwitcher';
import Sidebar from './components/Sidebar';
import { getSiteContent } from './data/siteContent';
import AgentCatalog from './views/AgentCatalog';
import Dashboard from './views/Dashboard';
import Landing from './views/Landing';
import Workspace from './views/Workspace';
import type { View } from './types';

const APP_COPY: Record<
  Language,
  {
    loading: string;
    healthy: string;
    signOut: string;
    signIn: string;
    createAccount: string;
    anonymousAvatar: string;
  }
> = {
  en: {
    loading: 'Initializing RoboQC...',
    healthy: 'System healthy',
    signOut: 'Sign out',
    signIn: 'Sign in',
    createAccount: 'Create account',
    anonymousAvatar: '?',
  },
  ru: {
    loading: 'РРЅРёС†РёР°Р»РёР·Р°С†РёСЏ RoboQC...',
    healthy: 'РЎРёСЃС‚РµРјР° РІ РЅРѕСЂРјРµ',
    signOut: 'Р’С‹Р№С‚Рё',
    signIn: 'Р’РѕР№С‚Рё',
    createAccount: 'РЎРѕР·РґР°С‚СЊ Р°РєРєР°СѓРЅС‚',
    anonymousAvatar: '?',
  },
  he: {
    loading: 'מאתחל את RoboQC...',
    healthy: 'המערכת תקינה',
    signOut: 'התנתק',
    signIn: 'התחבר',
    createAccount: 'צור חשבון',
    anonymousAvatar: '?',
  },
};

function upsertMetaTag(
  selector: string,
  attribute: 'name' | 'property',
  key: string,
  content: string
) {
  let tag = document.head.querySelector<HTMLMetaElement>(selector);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attribute, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function upsertCanonical(url: string) {
  let tag = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!tag) {
    tag = document.createElement('link');
    tag.setAttribute('rel', 'canonical');
    document.head.appendChild(tag);
  }
  tag.setAttribute('href', url);
}

function useSiteMeta(language: Language) {
  const site = getSiteContent(language);

  useEffect(() => {
    const canonicalUrl =
      language === 'en'
        ? 'https://romeoflexvision.com/'
        : `https://romeoflexvision.com/?lang=${language}`;

    document.title = site.meta.title;
    upsertMetaTag('meta[name="description"]', 'name', 'description', site.meta.description);
    upsertMetaTag('meta[property="og:title"]', 'property', 'og:title', site.meta.ogTitle);
    upsertMetaTag(
      'meta[property="og:description"]',
      'property',
      'og:description',
      site.meta.ogDescription
    );
    upsertMetaTag('meta[property="og:url"]', 'property', 'og:url', canonicalUrl);
    upsertMetaTag(
      'meta[property="og:image"]',
      'property',
      'og:image',
      'https://romeoflexvision.com/og-preview.svg'
    );
    upsertMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    upsertMetaTag('meta[name="theme-color"]', 'name', 'theme-color', '#0b1220');
    upsertCanonical(canonicalUrl);
  }, [language, site.meta.description, site.meta.ogDescription, site.meta.ogTitle, site.meta.title]);
}

function ProductShell({
  currentView,
  navigate,
  isAuthenticated,
  openLogin,
  openRegister,
  signOut,
}: {
  currentView: View;
  navigate: (view: View) => void;
  isAuthenticated: boolean;
  openLogin: () => void;
  openRegister: () => void;
  signOut: () => void;
}) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const copy = APP_COPY[language];

  return (
    <div className="flex h-screen overflow-hidden bg-bg-primary text-text-primary">
      <Sidebar currentView={currentView} onNavigate={navigate} isAuthenticated={isAuthenticated} />

      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border-subtle px-6">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-cyan" />
            {copy.healthy}
          </div>

          <div className="ml-auto flex items-center gap-3">
            <LanguageSwitcher />
            {isAuthenticated ? (
              <>
                <div className="hidden items-center gap-2 sm:flex">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full border border-accent-blue/40 bg-accent-blue/20 text-xs font-medium text-accent-blue">
                    {user?.email?.[0]?.toUpperCase() ?? copy.anonymousAvatar}
                  </div>
                  <span className="max-w-[160px] truncate text-xs text-text-secondary">
                    {user?.email}
                  </span>
                </div>
                <button
                  onClick={() => {
                    signOut();
                    navigate('landing');
                  }}
                  className="btn-ghost text-xs"
                >
                  {copy.signOut}
                </button>
              </>
            ) : (
              <>
                <button onClick={openLogin} className="btn-ghost text-xs">
                  {copy.signIn}
                </button>
                <button onClick={openRegister} className="btn-primary py-1.5 text-xs">
                  {copy.createAccount}
                </button>
              </>
            )}
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {currentView === 'catalog' && <AgentCatalog />}
          {currentView === 'workspace' && isAuthenticated && <Workspace />}
          {currentView === 'dashboard' && isAuthenticated && <Dashboard />}
        </div>
      </main>
    </div>
  );
}

function Shell() {
  const { user, loading, signOut } = useAuth();
  const { language } = useLanguage();
  const [currentView, setCurrentView] = useState<View>('landing');
  const [authModal, setAuthModal] = useState<{ open: boolean; tab: 'login' | 'register' }>({
    open: false,
    tab: 'login',
  });

  useSiteMeta(language);

  const isAuthenticated = Boolean(user);
  const copy = APP_COPY[language];

  const effectiveView =
    !isAuthenticated && (currentView === 'workspace' || currentView === 'dashboard')
      ? 'landing'
      : currentView;

  const navigate = (view: View) => {
    if ((view === 'workspace' || view === 'dashboard') && !isAuthenticated) {
      setAuthModal({ open: true, tab: 'login' });
      return;
    }
    setCurrentView(view);
  };

  const openRegister = () => setAuthModal({ open: true, tab: 'register' });
  const openLogin = () => setAuthModal({ open: true, tab: 'login' });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-primary">
        <div className="flex flex-col items-center gap-4">
          <img
            src={`${import.meta.env.BASE_URL}assets/brand/roboqc-icon-64.png`}
            alt="RoboQC"
            className="h-12 w-12 animate-pulse"
          />
          <span className="text-sm text-text-muted">{copy.loading}</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {effectiveView === 'landing' ? (
        <Landing
          onNavigate={navigate}
          onLogin={openLogin}
          onRegister={openRegister}
          onSignOut={() => {
            signOut();
            setCurrentView('landing');
          }}
          isAuthenticated={isAuthenticated}
        />
      ) : (
        <ProductShell
          currentView={effectiveView}
          navigate={navigate}
          isAuthenticated={isAuthenticated}
          openLogin={openLogin}
          openRegister={openRegister}
          signOut={signOut}
        />
      )}

      {authModal.open && (
        <AuthModal
          initialTab={authModal.tab}
          onClose={() => setAuthModal((current) => ({ ...current, open: false }))}
          onSuccess={() => setCurrentView('catalog')}
        />
      )}
    </>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Shell />
      </AuthProvider>
    </LanguageProvider>
  );
}

