import { useAuth } from '../context/AuthContext';
import { type Language, useLanguage } from '../context/LanguageContext';
import type { View } from '../types';

interface SidebarProps {
  currentView: View;
  onNavigate: (view: View) => void;
  isAuthenticated: boolean;
}

const NAV_LABELS: Record<
  Language,
  { guest: string; unauthorized: string; operator: string; authorizationRequired: string; items: Record<View, string> }
> = {
  en: {
    guest: 'Guest',
    unauthorized: 'Not signed in',
    operator: 'Operator',
    authorizationRequired: 'Authorization required',
    items: {
      landing: 'Home',
      catalog: 'Agents',
      workspace: 'Workspace',
      dashboard: 'Monitoring',
    },
  },
  ru: {
    guest: 'Гость',
    unauthorized: 'Не авторизован',
    operator: 'Оператор',
    authorizationRequired: 'Требуется авторизация',
    items: {
      landing: 'Главная',
      catalog: 'Агенты',
      workspace: 'Рабочее пространство',
      dashboard: 'Мониторинг',
    },
  },
  he: {
    guest: 'אורח',
    unauthorized: 'לא מחובר',
    operator: 'מפעיל',
    authorizationRequired: 'נדרש אימות',
    items: {
      landing: 'דף הבית',
      catalog: 'סוכנים',
      workspace: 'מרחב עבודה',
      dashboard: 'ניטור',
    },
  },
};

const NAV_ITEMS: { view: View; icon: string; requiresAuth: boolean }[] = [
  { view: 'landing', icon: '⬡', requiresAuth: false },
  { view: 'catalog', icon: '◈', requiresAuth: false },
  { view: 'workspace', icon: '◆', requiresAuth: true },
  { view: 'dashboard', icon: '◉', requiresAuth: true },
];

export default function Sidebar({ currentView, onNavigate, isAuthenticated }: SidebarProps) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const initials = user?.email?.[0]?.toUpperCase() ?? '?';
  const emailShort = user?.email ?? NAV_LABELS[language].guest;
  const copy = NAV_LABELS[language];

  return (
    <aside className="w-14 lg:w-56 bg-bg-secondary border-r border-border-subtle flex flex-col h-screen sticky top-0 shrink-0">
      {/* Logo */}
      <div className="h-14 flex items-center px-3 lg:px-4 border-b border-border-subtle gap-2.5">
        <div
          className="w-7 h-7 flex items-center justify-center text-accent-blue text-lg shrink-0"
          style={{ filter: 'drop-shadow(0 0 8px #7aa2f7)' }}
        >
          ⬢
        </div>
        <span className="hidden lg:block text-sm font-semibold text-text-primary tracking-wide">
          Romeo<span className="text-accent-blue">Flex</span>Vision
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 flex flex-col gap-1 px-2">
        {NAV_ITEMS.map((item) => {
          const active = currentView === item.view;
          const locked = item.requiresAuth && !isAuthenticated;
          return (
            <button
              key={item.view}
              onClick={() => onNavigate(item.view)}
              className={`
                flex items-center gap-3 px-2 py-2.5 rounded-lg text-sm transition-all duration-150 w-full text-left
                ${active
                  ? 'bg-accent-blue bg-opacity-15 text-accent-blue'
                  : locked
                    ? 'text-text-muted opacity-50 hover:opacity-70'
                    : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'}
              `}
              title={locked ? copy.authorizationRequired : copy.items[item.view]}
            >
              <span className="text-base w-5 text-center shrink-0">{item.icon}</span>
              <span className="hidden lg:block truncate">{copy.items[item.view]}</span>
              {locked && <span className="hidden lg:block ml-auto text-xs opacity-40">🔒</span>}
            </button>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="p-2 border-t border-border-subtle">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${
              isAuthenticated
                ? 'bg-accent-blue bg-opacity-20 border border-accent-blue border-opacity-40 text-accent-blue'
                : 'bg-bg-card border border-border-subtle text-text-muted'
            }`}
          >
            {initials}
          </div>
          <div className="hidden lg:block min-w-0">
            <div className="text-xs text-text-secondary truncate" title={emailShort}>
              {isAuthenticated ? emailShort : copy.unauthorized}
            </div>
            {isAuthenticated && (
              <div className="text-xs text-text-muted">{copy.operator}</div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
