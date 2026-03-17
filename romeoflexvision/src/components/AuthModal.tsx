import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';

interface AuthModalProps {
  initialTab?: 'login' | 'register';
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AuthModal({ initialTab = 'login', onClose, onSuccess }: AuthModalProps) {
  const { signIn, signUp, signInWithGoogle, isConfigured } = useAuth();
  const { t } = useI18n();
  const [tab, setTab] = useState<'login' | 'register'>(initialTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setError(null);
    setInfo(null);
    setPassword('');
    setConfirmPassword('');
  }, [tab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!email.trim()) { setError(t.modal.errEmail); return; }
    if (!password)     { setError(t.modal.errPassword); return; }

    if (tab === 'register') {
      if (password.length < 6) { setError(t.modal.errMinLength); return; }
      if (password !== confirmPassword) { setError(t.modal.errMismatch); return; }

      setLoading(true);
      const { error: err } = await signUp(email, password);
      setLoading(false);

      if (err) { setError(err); return; }

      if (isConfigured) {
        setInfo(`${t.modal.confirmSent} ${email}. ${t.modal.confirmSentEnd}`);
      } else {
        onSuccess?.();
        onClose();
      }
    } else {
      setLoading(true);
      const { error: err } = await signIn(email, password);
      setLoading(false);
      if (err) { setError(err); return; }
      onSuccess?.();
      onClose();
    }
  };

  const handleGoogle = async () => {
    setError(null);
    const { error: err } = await signInWithGoogle();
    if (err) setError(err);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-panel w-full max-w-sm p-7" onClick={e => e.stopPropagation()}>
        {/* Logo */}
        <div className="flex justify-center mb-5">
          <span className="text-3xl text-accent-blue" style={{ filter: 'drop-shadow(0 0 10px #7aa2f7)' }}>⬢</span>
        </div>

        {/* Tabs */}
        <div className="flex mb-6 border-b border-border-subtle">
          {(['login', 'register'] as const).map(tb => (
            <button key={tb} onClick={() => setTab(tb)}
              className={`flex-1 py-2 text-sm transition-colors border-b-2 -mb-px ${
                tab === tb ? 'border-accent-blue text-accent-blue' : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}>
              {tb === 'login' ? t.modal.loginTab : t.modal.registerTab}
            </button>
          ))}
        </div>

        {/* Demo mode notice */}
        {!isConfigured && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-accent-blue bg-opacity-10 border border-accent-blue border-opacity-25 text-xs text-text-secondary">
            <span className="text-accent-blue font-medium">{t.modal.demoMode}</span> — {t.modal.demoModeDesc}{' '}
            <code className="text-text-primary bg-bg-panel px-1 rounded">.env</code> {t.modal.demoModeDescEnd}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-text-muted mb-1.5">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="operator@company.com" autoComplete="email"
              className="w-full bg-bg-card border border-border-subtle rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder-text-muted outline-none focus:border-accent-blue transition-colors" />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1.5">{t.modal.passwordLabel}</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" autoComplete={tab === 'register' ? 'new-password' : 'current-password'}
              className="w-full bg-bg-card border border-border-subtle rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder-text-muted outline-none focus:border-accent-blue transition-colors" />
          </div>
          {tab === 'register' && (
            <div>
              <label className="block text-xs text-text-muted mb-1.5">{t.modal.confirmLabel}</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••" autoComplete="new-password"
                className="w-full bg-bg-card border border-border-subtle rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder-text-muted outline-none focus:border-accent-blue transition-colors" />
            </div>
          )}

          {error && (
            <div className="px-3 py-2 rounded-lg bg-signal-alert bg-opacity-10 border border-signal-alert border-opacity-30 text-xs text-signal-alert">
              {error}
            </div>
          )}
          {info && (
            <div className="px-3 py-2 rounded-lg bg-accent-cyan bg-opacity-10 border border-accent-cyan border-opacity-30 text-xs text-accent-cyan">
              {info}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="btn-primary w-full py-2.5 mt-1 flex items-center justify-center gap-2 disabled:opacity-60">
            {loading && <span className="w-3.5 h-3.5 border-2 border-bg-primary border-t-transparent rounded-full animate-spin" />}
            {tab === 'login' ? t.modal.submitLogin : t.modal.submitRegister}
          </button>
        </form>

        {/* OAuth */}
        {isConfigured && (
          <>
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-border-subtle" />
              <span className="text-xs text-text-muted">{t.modal.orSeparator}</span>
              <div className="flex-1 h-px bg-border-subtle" />
            </div>
            <button onClick={handleGoogle}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-border-subtle text-sm text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {t.modal.googleLogin}
            </button>
          </>
        )}

        <p className="text-xs text-text-muted text-center mt-5">
          {tab === 'login'
            ? <>{t.modal.noAccount} <button onClick={() => setTab('register')} className="text-accent-blue hover:underline">{t.modal.registerLink}</button></>
            : <>{t.modal.haveAccount} <button onClick={() => setTab('login')} className="text-accent-blue hover:underline">{t.modal.loginLink}</button></>
          }
        </p>
      </div>
    </div>
  );
}
