import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import {
  LANGUAGE_META,
  LanguageProvider,
  type Language,
  useLanguage,
} from './context/LanguageContext';
import Sidebar from './components/Sidebar';
import AuthModal from './components/AuthModal';
import Landing from './views/Landing';
import AgentCatalog from './views/AgentCatalog';
import Workspace from './views/Workspace';
import Dashboard from './views/Dashboard';
import type { View } from './types';

const APP_COPY: Record<
  Language,
  {
    loading: string;
    healthy: string;
    signOut: string;
    signIn: string;
    createAccount: string;
    metaDescription: string;
  }
> = {
  en: {
    loading: 'Initializing platform...',
    healthy: 'System healthy',
    signOut: 'Sign out',
    signIn: 'Sign in',
    createAccount: 'Create account',
    metaDescription:
      'A multi-agent AI platform for quality control, analytics, predictive maintenance, and orchestration in Industry 4.0.',
  },
  ru: {
    loading: 'Инициализация платформы...',
    healthy: 'Система в норме',
    signOut: 'Выйти',
    signIn: 'Войти',
    createAccount: 'Создать аккаунт',
    metaDescription:
      'Многоагентная ИИ-платформа для контроля качества, аналитики, предиктивного обслуживания и оркестрации в парадигме Индустрии 4.0.',
  },
  he: {
    loading: 'מאתחל את הפלטפורמה...',
    healthy: 'המערכת תקינה',
    signOut: 'התנתק',
    signIn: 'התחבר',
    createAccount: 'צור חשבון',
    metaDescription:
      'פלטפורמת AI מרובת-סוכנים לבקרת איכות, אנליטיקה, תחזוקה חזויה ותזמור תהליכים עבור Industry 4.0.',
  },
};

function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-1 rounded-lg border border-border-subtle bg-bg-card p-1">
      {(Object.entries(LANGUAGE_META) as [Language, (typeof LANGUAGE_META)[Language]][]).map(
        ([code, meta]) => (
          <button
            key={code}
            onClick={() => setLanguage(code)}
            className={`rounded-md px-2 py-1 text-[10px] sm:text-[11px] font-semibold transition-colors ${
              language === code
                ? 'bg-accent-blue bg-opacity-15 text-accent-blue'
                : 'text-text-muted hover:text-text-primary'
            }`}
            title={meta.nativeLabel}
          >
            {meta.label}
          </button>
        )
      )}
    </div>
  );
}

// ---- Inner shell (has access to AuthContext) ----
function Shell() {
  const { user, loading, signOut } = useAuth();
  const { language } = useLanguage();
  const [currentView, setCurrentView] = useState<View>('landing');
  const [authModal, setAuthModal] = useState<{ open: boolean; tab: 'login' | 'register' }>({ open: false, tab: 'login' });

  const isAuthenticated = Boolean(user);
  const copy = APP_COPY[language];

  useEffect(() => {
    document.title = 'RomeoFlexVision — Agentic AI Platform';
    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.setAttribute('content', copy.metaDescription);
    }
  }, [copy.metaDescription]);

  const navigate = (view: View) => {
    if ((view === 'workspace' || view === 'dashboard') && !isAuthenticated) {
      setAuthModal({ open: true, tab: 'login' });
      return;
    }
    setCurrentView(view);
  };

  const openRegister = () => setAuthModal({ open: true, tab: 'register' });
  const openLogin = () => setAuthModal({ open: true, tab: 'login' });

  const handleAuthSuccess = () => {
    // After successful auth, go to catalog
    setCurrentView('catalog');
  };

  // Redirect to landing if session ends while on protected view
  if (!isAuthenticated && (currentView === 'workspace' || currentView === 'dashboard')) {
    setCurrentView('landing');
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-primary">
        <div className="flex flex-col items-center gap-4">
          <span className="text-4xl text-accent-blue animate-pulse" style={{ filter: 'drop-shadow(0 0 12px #7aa2f7)' }}>⬢</span>
          <span className="text-sm text-text-muted">{copy.loading}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-bg-primary text-text-primary overflow-hidden">
      <Sidebar currentView={currentView} onNavigate={navigate} isAuthenticated={isAuthenticated} />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 border-b border-border-subtle flex items-center px-6 gap-4 shrink-0">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan animate-pulse" />
            {copy.healthy}
          </div>

          <div className="ml-auto flex items-center gap-3">
            <LanguageSwitcher />
            {isAuthenticated ? (
              <>
                <div className="hidden sm:flex items-center gap-2">
                  {/* User avatar */}
                  <div className="w-6 h-6 rounded-full bg-accent-blue bg-opacity-20 border border-accent-blue border-opacity-40 flex items-center justify-center text-xs text-accent-blue font-medium">
                    {user?.email?.[0]?.toUpperCase() ?? '○'}
                  </div>
                  <span className="text-xs text-text-secondary max-w-[160px] truncate">{user?.email}</span>
                </div>
                <button
                  onClick={() => { signOut(); setCurrentView('landing'); }}
                  className="btn-ghost text-xs"
                >
                  {copy.signOut}
                </button>
              </>
            ) : (
              <>
                <button onClick={openLogin} className="btn-ghost text-xs">{copy.signIn}</button>
                <button onClick={openRegister} className="btn-primary text-xs py-1.5">{copy.createAccount}</button>
              </>
            )}
          </div>
        </header>

        {/* View content */}
        <div className="flex-1 flex overflow-hidden">
          {currentView === 'landing' && (
            <Landing onNavigate={navigate} onRegister={openRegister} />
          )}
          {currentView === 'catalog' && <AgentCatalog />}
          {currentView === 'workspace' && isAuthenticated && <Workspace />}
          {currentView === 'dashboard' && isAuthenticated && <Dashboard />}
        </div>
      </main>

      {/* Auth modal */}
      {authModal.open && (
        <AuthModal
          initialTab={authModal.tab}
          onClose={() => setAuthModal(m => ({ ...m, open: false }))}
          onSuccess={handleAuthSuccess}
        />
      )}
    </div>
  );
}

// ---- Root: wrap with AuthProvider ----
export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Shell />
      </AuthProvider>
    </LanguageProvider>
  );
}
