import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { type Language, useLanguage } from '../context/LanguageContext';

interface AuthModalProps {
  initialTab?: 'login' | 'register';
  onClose: () => void;
  onSuccess?: () => void;
}

const COPY: Record<
  Language,
  {
    login: string;
    register: string;
    demoMode: string;
    demoModeDesc: string;
    email: string;
    password: string;
    confirmPassword: string;
    submitLogin: string;
    submitRegister: string;
    google: string;
    or: string;
    noAccount: string;
    haveAccount: string;
    registerLink: string;
    loginLink: string;
    confirmationSent: string;
    errors: Record<string, string>;
  }
> = {
  en: {
    login: 'Sign in',
    register: 'Register',
    demoMode: 'Demo mode',
    demoModeDesc:
      'Supabase is not configured. Any credentials will work. Add .env for production.',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Repeat password',
    submitLogin: 'Sign in',
    submitRegister: 'Create account',
    google: 'Continue with Google',
    or: 'or',
    noAccount: "Don't have an account?",
    haveAccount: 'Already have an account?',
    registerLink: 'Create one',
    loginLink: 'Sign in',
    confirmationSent:
      'A confirmation email was sent to {email}. Follow the link and then sign in.',
    errors: {
      enterEmail: 'Enter email',
      enterPassword: 'Enter password',
      passwordLength: 'Password must contain at least 6 characters',
      passwordMismatch: 'Passwords do not match',
      unknown: 'Unknown error',
      invalidCredentials: 'Invalid email or password',
      emailNotConfirmed: 'Confirm your email before signing in',
      userExists: 'A user with this email already exists',
      invalidEmail: 'Invalid email address',
      connection: 'No server connection. Check VITE_SUPABASE_URL',
      demoCredentials: 'Enter email and password',
      supabaseMissing: 'Supabase is not configured',
    },
  },
  ru: {
    login: 'Войти',
    register: 'Регистрация',
    demoMode: 'Демо-режим',
    demoModeDesc:
      'Supabase не настроен. Любые данные работают. Добавьте .env для продакшена.',
    email: 'Email',
    password: 'Пароль',
    confirmPassword: 'Повторите пароль',
    submitLogin: 'Войти',
    submitRegister: 'Создать аккаунт',
    google: 'Войти через Google',
    or: 'или',
    noAccount: 'Нет аккаунта?',
    haveAccount: 'Уже есть аккаунт?',
    registerLink: 'Зарегистрироваться',
    loginLink: 'Войти',
    confirmationSent:
      'Письмо с подтверждением отправлено на {email}. Перейдите по ссылке и затем войдите.',
    errors: {
      enterEmail: 'Введите email',
      enterPassword: 'Введите пароль',
      passwordLength: 'Пароль должен содержать минимум 6 символов',
      passwordMismatch: 'Пароли не совпадают',
      unknown: 'Неизвестная ошибка',
      invalidCredentials: 'Неверный email или пароль',
      emailNotConfirmed: 'Подтвердите email перед входом',
      userExists: 'Пользователь с таким email уже существует',
      invalidEmail: 'Некорректный email',
      connection: 'Нет соединения с сервером. Проверьте VITE_SUPABASE_URL',
      demoCredentials: 'Введите email и пароль',
      supabaseMissing: 'Supabase не настроен',
    },
  },
  he: {
    login: 'התחבר',
    register: 'הרשמה',
    demoMode: 'מצב הדגמה',
    demoModeDesc:
      'Supabase לא מוגדר. כל פרטי כניסה יעבדו. הוסף .env לסביבת ייצור.',
    email: 'אימייל',
    password: 'סיסמה',
    confirmPassword: 'הקלד שוב סיסמה',
    submitLogin: 'התחבר',
    submitRegister: 'צור חשבון',
    google: 'המשך עם Google',
    or: 'או',
    noAccount: 'אין לך חשבון?',
    haveAccount: 'כבר יש לך חשבון?',
    registerLink: 'הירשם',
    loginLink: 'התחבר',
    confirmationSent:
      'נשלח מייל אימות אל {email}. פתח את הקישור ואז התחבר.',
    errors: {
      enterEmail: 'הזן אימייל',
      enterPassword: 'הזן סיסמה',
      passwordLength: 'הסיסמה חייבת להכיל לפחות 6 תווים',
      passwordMismatch: 'הסיסמאות אינן תואמות',
      unknown: 'שגיאה לא ידועה',
      invalidCredentials: 'אימייל או סיסמה שגויים',
      emailNotConfirmed: 'אשר את האימייל לפני ההתחברות',
      userExists: 'משתמש עם האימייל הזה כבר קיים',
      invalidEmail: 'כתובת אימייל לא תקינה',
      connection: 'אין חיבור לשרת. בדוק את VITE_SUPABASE_URL',
      demoCredentials: 'הזן אימייל וסיסמה',
      supabaseMissing: 'Supabase לא מוגדר',
    },
  },
};

function formatTemplate(template: string, values: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? '');
}

function AuthModalContent({
  initialTab = 'login',
  onClose,
  onSuccess,
  language,
}: AuthModalProps & { language: Language }) {
  const { signIn, signUp, signInWithGoogle, isConfigured } = useAuth();
  const copy = COPY[language];
  const [tab, setTab] = useState<'login' | 'register'>(initialTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const resetMessages = () => {
    setError(null);
    setInfo(null);
    setPassword('');
    setConfirmPassword('');
  };

  const handleTabChange = (nextTab: 'login' | 'register') => {
    setTab(nextTab);
    resetMessages();
  };

  const resolveError = (code: string | null) => {
    if (!code) return null;
    return copy.errors[code] ?? code;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!email.trim()) {
      setError(copy.errors.enterEmail);
      return;
    }
    if (!password) {
      setError(copy.errors.enterPassword);
      return;
    }

    if (tab === 'register') {
      if (password.length < 6) {
        setError(copy.errors.passwordLength);
        return;
      }
      if (password !== confirmPassword) {
        setError(copy.errors.passwordMismatch);
        return;
      }

      setLoading(true);
      const { error: err } = await signUp(email, password);
      setLoading(false);

      if (err) {
        setError(resolveError(err));
        return;
      }

      if (isConfigured) {
        setInfo(formatTemplate(copy.confirmationSent, { email }));
      } else {
        onSuccess?.();
        onClose();
      }
    } else {
      setLoading(true);
      const { error: err } = await signIn(email, password);
      setLoading(false);
      if (err) {
        setError(resolveError(err));
        return;
      }
      onSuccess?.();
      onClose();
    }
  };

  const handleGoogle = async () => {
    setError(null);
    const { error: err } = await signInWithGoogle();
    if (err) {
      setError(resolveError(err));
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div className="glass-panel w-full max-w-sm p-7" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-center mb-5">
          <span
            className="text-3xl text-accent-blue"
            style={{ filter: 'drop-shadow(0 0 10px #7aa2f7)' }}
          >
            ⬢
          </span>
        </div>

        <div className="flex mb-6 border-b border-border-subtle">
          {(['login', 'register'] as const).map((currentTab) => (
            <button
              key={currentTab}
              onClick={() => handleTabChange(currentTab)}
              className={`flex-1 py-2 text-sm transition-colors border-b-2 -mb-px ${
                tab === currentTab
                  ? 'border-accent-blue text-accent-blue'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              {currentTab === 'login' ? copy.login : copy.register}
            </button>
          ))}
        </div>

        {!isConfigured && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-accent-blue bg-opacity-10 border border-accent-blue border-opacity-25 text-xs text-text-secondary">
            <span className="text-accent-blue font-medium">{copy.demoMode}</span> —{' '}
            {copy.demoModeDesc}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-text-muted mb-1.5">{copy.email}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@company.com"
              autoComplete="email"
              className="w-full bg-bg-card border border-border-subtle rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder-text-muted outline-none focus:border-accent-blue transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1.5">{copy.password}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={tab === 'register' ? 'new-password' : 'current-password'}
              className="w-full bg-bg-card border border-border-subtle rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder-text-muted outline-none focus:border-accent-blue transition-colors"
            />
          </div>
          {tab === 'register' && (
            <div>
              <label className="block text-xs text-text-muted mb-1.5">
                {copy.confirmPassword}
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                className="w-full bg-bg-card border border-border-subtle rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder-text-muted outline-none focus:border-accent-blue transition-colors"
              />
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

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-2.5 mt-1 flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading && (
              <span className="w-3.5 h-3.5 border-2 border-bg-primary border-t-transparent rounded-full animate-spin" />
            )}
            {tab === 'login' ? copy.submitLogin : copy.submitRegister}
          </button>
        </form>

        {isConfigured && (
          <>
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-border-subtle" />
              <span className="text-xs text-text-muted">{copy.or}</span>
              <div className="flex-1 h-px bg-border-subtle" />
            </div>
            <button
              onClick={handleGoogle}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-border-subtle text-sm text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {copy.google}
            </button>
          </>
        )}

        <p className="text-xs text-text-muted text-center mt-5">
          {tab === 'login' ? (
            <>
              {copy.noAccount}{' '}
              <button
                onClick={() => handleTabChange('register')}
                className="text-accent-blue hover:underline"
              >
                {copy.registerLink}
              </button>
            </>
          ) : (
            <>
              {copy.haveAccount}{' '}
              <button
                onClick={() => handleTabChange('login')}
                className="text-accent-blue hover:underline"
              >
                {copy.loginLink}
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

export default function AuthModal(props: AuthModalProps) {
  const { language } = useLanguage();

  return <AuthModalContent key={language} {...props} language={language} />;
}
