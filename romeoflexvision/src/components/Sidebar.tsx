import { BarChart3, Bot, Home, Lock, Radar } from 'lucide-react';
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
  {
    guest: string;
    unauthorized: string;
    operator: string;
    authorizationRequired: string;
    items: Record<View, string>;
  }
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
    guest: 'Р“РѕСЃС‚СЊ',
    unauthorized: 'РќРµ Р°РІС‚РѕСЂРёР·РѕРІР°РЅ',
    operator: 'РћРїРµСЂР°С‚РѕСЂ',
    authorizationRequired: 'РќСѓР¶РЅР° Р°РІС‚РѕСЂРёР·Р°С†РёСЏ',
    items: {
      landing: 'Р“Р»Р°РІРЅР°СЏ',
      catalog: 'РђРіРµРЅС‚С‹',
      workspace: 'Р Р°Р±РѕС‡РµРµ РїСЂРѕСЃС‚СЂР°РЅСЃС‚РІРѕ',
      dashboard: 'РњРѕРЅРёС‚РѕСЂРёРЅРі',
    },
  },
  he: {
    guest: 'אורח',
    unauthorized: 'לא מחובר',
    operator: 'מפעיל',
    authorizationRequired: 'נדרשת התחברות',
    items: {
      landing: 'דף הבית',
      catalog: 'סוכנים',
      workspace: 'סביבת עבודה',
      dashboard: 'ניטור',
    },
  },
};

const NAV_ITEMS: Array<{ view: View; icon: typeof Home; requiresAuth: boolean }> = [
  { view: 'landing', icon: Home, requiresAuth: false },
  { view: 'catalog', icon: Bot, requiresAuth: false },
  { view: 'workspace', icon: Radar, requiresAuth: true },
  { view: 'dashboard', icon: BarChart3, requiresAuth: true },
];

export default function Sidebar({ currentView, onNavigate, isAuthenticated }: SidebarProps) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const copy = NAV_LABELS[language];
  const initials = user?.email?.[0]?.toUpperCase() ?? '?';
  const emailShort = user?.email ?? copy.guest;

  return (
    <aside className="sticky top-0 flex h-screen w-14 shrink-0 flex-col border-r border-border-subtle bg-bg-secondary lg:w-56">
      <div className="flex h-14 items-center gap-2.5 border-b border-border-subtle px-3 lg:px-4">
        <img
          src={`${import.meta.env.BASE_URL}assets/brand/roboqc-icon-64.png`}
          alt="RoboQC"
          className="h-8 w-8 shrink-0"
        />
        <span className="hidden text-sm font-semibold tracking-wide text-text-primary lg:block">
          Robo<span className="text-accent-blue">QC</span>
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-2 py-4">
        {NAV_ITEMS.map((item) => {
          const active = currentView === item.view;
          const locked = item.requiresAuth && !isAuthenticated;
          const Icon = item.icon;

          return (
            <button
              key={item.view}
              onClick={() => onNavigate(item.view)}
              className={`flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left text-sm transition-all duration-150 ${
                active
                  ? 'bg-accent-blue/15 text-accent-blue'
                  : locked
                    ? 'text-text-muted opacity-50 hover:opacity-70'
                    : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
              }`}
              title={locked ? copy.authorizationRequired : copy.items[item.view]}
            >
              <Icon size={18} className="w-5 shrink-0" />
              <span className="hidden truncate lg:block">{copy.items[item.view]}</span>
              {locked && (
                <span className="ml-auto hidden lg:block">
                  <Lock size={14} className="opacity-50" />
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-border-subtle p-2">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <div
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
              isAuthenticated
                ? 'border border-accent-blue/40 bg-accent-blue/20 text-accent-blue'
                : 'border border-border-subtle bg-bg-card text-text-muted'
            }`}
          >
            {initials}
          </div>
          <div className="hidden min-w-0 lg:block">
            <div className="truncate text-xs text-text-secondary" title={emailShort}>
              {isAuthenticated ? emailShort : copy.unauthorized}
            </div>
            {isAuthenticated && <div className="text-xs text-text-muted">{copy.operator}</div>}
          </div>
        </div>
      </div>
    </aside>
  );
}

