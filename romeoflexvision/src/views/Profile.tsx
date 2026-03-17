import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useI18n } from '../context/I18nContext';
import { useTasks } from '../hooks/useTasks';
import { isSupabaseConfigured } from '../lib/supabase';

export default function Profile() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const { t, locale } = useI18n();
  const { tasks } = useTasks();

  const [copied, setCopied] = useState(false);

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    running: tasks.filter(t => t.status === 'running').length,
    errors: tasks.filter(t => t.status === 'error').length,
  };

  const copyId = () => {
    if (!user?.id) return;
    navigator.clipboard.writeText(user.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleSignOut = async () => {
    await signOut();
    toast(t.auth.signedOut, 'info');
  };

  const initials = user?.email?.[0]?.toUpperCase() ?? '?';
  const dateLocale = locale === 'he' ? 'he-IL' : locale === 'en' ? 'en-GB' : 'ru-RU';
  const createdDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(dateLocale, { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-6 lg:px-8 py-6 max-w-2xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold text-text-primary">{t.profile.title}</h1>
          <p className="text-xs text-text-muted mt-0.5">{t.profile.subtitle}</p>
        </div>

        {/* User card */}
        <div className="glass-panel p-6 flex items-center gap-5">
          <div className="w-14 h-14 rounded-full bg-accent-blue bg-opacity-15 border-2 border-accent-blue border-opacity-40 flex items-center justify-center text-2xl font-semibold text-accent-blue shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-base font-medium text-text-primary truncate">{user?.email ?? t.profile.demoUser}</div>
            <div className="text-xs text-text-muted mt-0.5">{t.auth.operator} · {t.profile.regDate}: {createdDate}</div>
            <div className="flex items-center gap-2 mt-2">
              <span className={`tag text-xs border ${
                isSupabaseConfigured
                  ? 'border-accent-cyan text-accent-cyan bg-accent-cyan bg-opacity-10'
                  : 'border-signal-warning text-signal-warning bg-signal-warning bg-opacity-10'
              }`}>
                {isSupabaseConfigured ? 'Supabase Auth' : 'Демо-режим'}
              </span>
            </div>
          </div>
          <button onClick={handleSignOut} className="btn-ghost text-xs border border-border-subtle shrink-0">
            {t.auth.signOut}
          </button>
        </div>

        {/* Task stats */}
        <div>
          <div className="text-xs text-text-muted uppercase tracking-widest mb-3">{t.profile.statsTitle}</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: t.profile.total,     value: stats.total,     color: 'text-text-primary' },
              { label: t.profile.completed, value: stats.completed, color: 'text-accent-cyan' },
              { label: t.profile.running,   value: stats.running,   color: 'text-accent-blue' },
              { label: t.profile.errors,    value: stats.errors,    color: 'text-signal-alert' },
            ].map(s => (
              <div key={s.label} className="glass-panel p-4 text-center">
                <div className={`text-3xl font-mono font-semibold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-text-muted mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Account info */}
        <div className="glass-panel p-5 space-y-3">
          <div className="text-xs text-text-muted uppercase tracking-widest mb-1">{t.profile.accountInfo}</div>

          <div className="flex items-center justify-between py-2 border-b border-border-subtle">
            <span className="text-sm text-text-secondary">{t.profile.email}</span>
            <span className="text-sm text-text-primary font-mono">{user?.email ?? '—'}</span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-border-subtle">
            <span className="text-sm text-text-secondary">{t.profile.userId}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted font-mono truncate max-w-[140px]">
                {user?.id?.slice(0, 8)}...
              </span>
              <button onClick={copyId} className="text-xs text-accent-blue hover:underline">
                {copied ? t.profile.copied : t.profile.copy}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-text-secondary">{t.profile.provider}</span>
            <span className="text-sm text-text-primary capitalize">
              {user?.app_metadata?.provider ?? (isSupabaseConfigured ? 'email' : 'demo')}
            </span>
          </div>
        </div>

        {/* Supabase setup hint */}
        {!isSupabaseConfigured && (
          <div className="glass-panel p-5 border border-signal-warning border-opacity-25">
            <div className="text-sm font-medium text-signal-warning mb-2">{t.profile.supabaseWarn}</div>
            <div className="text-xs text-text-secondary leading-relaxed mb-3">
              {t.profile.supabaseDesc} <code className="bg-bg-card px-1 rounded text-text-primary">.env</code>:
            </div>
            <pre className="bg-bg-card rounded-lg p-3 text-xs font-mono text-text-secondary overflow-x-auto">
{`VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...`}
            </pre>
            <div className="text-xs text-text-muted mt-2">
              {t.profile.supabaseMigNote}: <code className="text-text-secondary">supabase/migrations/001_initial.sql</code>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
