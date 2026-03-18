import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { I18nProvider, useI18n } from './context/I18nContext';
import Sidebar from './components/Sidebar';
import AuthModal from './components/AuthModal';
import ToastContainer from './components/Toast';
import Landing from './views/Landing';
import AgentCatalog from './views/AgentCatalog';
import AgentGraph from './views/AgentGraph';
import AgentBuilder from './views/AgentBuilder';
import KnowledgeVault from './views/KnowledgeVault';
import FinOpsOptimizer from './views/FinOpsOptimizer';
import SimulationSandbox from './views/SimulationSandbox';
import Workspace from './views/Workspace';
import Dashboard from './views/Dashboard';
import Profile from './views/Profile';
import type { Agent, View } from './types';

// ---- Language toggle button (cycles RU → EN → HE → RU) ----
const LOCALE_CYCLE = ['ru', 'en', 'he'] as const;
const LOCALE_META: Record<string, { flag: string; label: string }> = {
  ru: { flag: '🇷🇺', label: 'RU' },
  en: { flag: '🇬🇧', label: 'EN' },
  he: { flag: '🇮🇱', label: 'HE' },
};

function LangToggle() {
  const { locale, setLocale } = useI18n();
  const next = LOCALE_CYCLE[(LOCALE_CYCLE.indexOf(locale) + 1) % LOCALE_CYCLE.length];
  const { flag, label } = LOCALE_META[locale];
  return (
    <button
      onClick={() => setLocale(next)}
      className="flex items-center gap-1 px-2 py-1 rounded-md bg-bg-card border border-border-subtle text-xs text-text-secondary hover:text-text-primary hover:border-accent-blue transition-colors"
      title="Toggle language / Сменить язык / שנה שפה"
    >
      <span>{flag}</span>
      <span className="font-mono">{label}</span>
    </button>
  );
}

// ---- Inner shell ----
function Shell() {
  const { user, loading, signOut } = useAuth();
  const { t } = useI18n();
  const [currentView, setCurrentView] = useState<View>('landing');
  const [authModal, setAuthModal] = useState<{ open: boolean; tab: 'login' | 'register' }>({ open: false, tab: 'login' });
  const [builderInitialAgent, setBuilderInitialAgent] = useState<Agent | null>(null);

  const isAuthenticated = Boolean(user);

  const navigate = (view: View) => {
    if ((view === 'workspace' || view === 'dashboard' || view === 'profile') && !isAuthenticated) {
      setAuthModal({ open: true, tab: 'login' });
      return;
    }
    setCurrentView(view);
  };

  const handleAuthSuccess = () => setCurrentView('catalog');

  if (!isAuthenticated && (currentView === 'workspace' || currentView === 'dashboard' || currentView === 'profile')) {
    setCurrentView('landing');
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-primary">
        <div className="flex flex-col items-center gap-4">
          <span className="text-4xl text-accent-blue animate-pulse" style={{ filter: 'drop-shadow(0 0 12px #7aa2f7)' }}>⬢</span>
          <span className="text-sm text-text-muted">RomeoFlexVision...</span>
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
            {t.topbar.systemOk}
          </div>

          <div className="ml-auto flex items-center gap-3">
            <LangToggle />

            {isAuthenticated ? (
              <>
                <button
                  onClick={() => navigate('profile')}
                  className="hidden sm:flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  <div className="w-6 h-6 rounded-full bg-accent-blue bg-opacity-20 border border-accent-blue border-opacity-40 flex items-center justify-center text-xs text-accent-blue font-medium">
                    {user?.email?.[0]?.toUpperCase() ?? '○'}
                  </div>
                  <span className="text-xs text-text-secondary max-w-[160px] truncate">{user?.email}</span>
                </button>
                <button onClick={() => { signOut(); setCurrentView('landing'); }} className="btn-ghost text-xs">
                  {t.auth.signOut}
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setAuthModal({ open: true, tab: 'login' })} className="btn-ghost text-xs">
                  {t.auth.signIn}
                </button>
                <button onClick={() => setAuthModal({ open: true, tab: 'register' })} className="btn-primary text-xs py-1.5">
                  {t.auth.register}
                </button>
              </>
            )}
          </div>
        </header>

        {/* Views */}
        <div className="flex-1 flex overflow-hidden">
          {currentView === 'landing'    && <Landing onNavigate={navigate} onRegister={() => setAuthModal({ open: true, tab: 'register' })} />}
          {currentView === 'catalog'    && (
            <AgentCatalog
              onEditAgent={(agent) => { setBuilderInitialAgent(agent); navigate('builder'); }}
            />
          )}
          {currentView === 'graph'      && <AgentGraph />}
          {currentView === 'builder'    && (
            <AgentBuilder
              initialAgent={builderInitialAgent}
              onGoToCatalog={() => { setBuilderInitialAgent(null); navigate('catalog'); }}
            />
          )}
          {currentView === 'vault'      && <KnowledgeVault />}
          {currentView === 'finops'     && isAuthenticated && <FinOpsOptimizer />}
          {currentView === 'sandbox'    && isAuthenticated && <SimulationSandbox />}
          {currentView === 'workspace'  && isAuthenticated && <Workspace />}
          {currentView === 'dashboard'  && isAuthenticated && <Dashboard />}
          {currentView === 'profile'    && isAuthenticated && <Profile />}
        </div>
      </main>

      {authModal.open && (
        <AuthModal
          initialTab={authModal.tab}
          onClose={() => setAuthModal(m => ({ ...m, open: false }))}
          onSuccess={handleAuthSuccess}
        />
      )}

      <ToastContainer />
    </div>
  );
}

// ---- Root ----
export default function App() {
  return (
    <AuthProvider>
      <I18nProvider>
        <ToastProvider>
          <Shell />
        </ToastProvider>
      </I18nProvider>
    </AuthProvider>
  );
}
