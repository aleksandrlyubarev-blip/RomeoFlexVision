import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Landing from './views/Landing';
import AgentCatalog from './views/AgentCatalog';
import Workspace from './views/Workspace';
import Dashboard from './views/Dashboard';
import type { View } from './types';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('landing');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const navigate = (view: View) => {
    if ((view === 'workspace' || view === 'dashboard') && !isAuthenticated) return;
    setCurrentView(view);
  };

  const handleRegister = () => {
    setIsAuthenticated(true);
    setCurrentView('catalog');
  };

  return (
    <div className="flex h-screen bg-bg-primary text-text-primary overflow-hidden">
      <Sidebar currentView={currentView} onNavigate={navigate} isAuthenticated={isAuthenticated} />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 border-b border-border-subtle flex items-center px-6 gap-4 shrink-0">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan animate-pulse" />
            Система в норме
          </div>
          <div className="ml-auto flex items-center gap-3">
            {!isAuthenticated ? (
              <>
                <button onClick={() => setIsAuthenticated(true)} className="btn-ghost text-xs">
                  Войти
                </button>
                <button onClick={handleRegister} className="btn-primary text-xs py-1.5">
                  Создать аккаунт
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-muted">Оператор</span>
                <button onClick={() => { setIsAuthenticated(false); setCurrentView('landing'); }}
                  className="btn-ghost text-xs">Выйти</button>
              </div>
            )}
          </div>
        </header>

        {/* View content */}
        <div className="flex-1 flex overflow-hidden">
          {currentView === 'landing' && (
            <Landing onNavigate={navigate} onRegister={handleRegister} />
          )}
          {currentView === 'catalog' && <AgentCatalog />}
          {currentView === 'workspace' && isAuthenticated && <Workspace />}
          {currentView === 'dashboard' && isAuthenticated && <Dashboard />}

          {/* Auth wall */}
          {(currentView === 'workspace' || currentView === 'dashboard') && !isAuthenticated && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl text-text-muted mb-4">🔒</div>
                <h2 className="text-lg font-semibold text-text-primary mb-2">Требуется авторизация</h2>
                <p className="text-sm text-text-secondary mb-6">Войдите в аккаунт для доступа к этому разделу</p>
                <button onClick={handleRegister} className="btn-primary">Создать аккаунт</button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
