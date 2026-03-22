import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// ---- Types ----
interface AuthResult {
  error: string | null;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<AuthResult>;
}

// ---- Context ----
const AuthContext = createContext<AuthContextValue | null>(null);

export function formatError(err: AuthError | Error | unknown): string {
  if (!err) return 'Неизвестная ошибка';
  const msg = (err as AuthError).message || String(err);
  // Translate common Supabase messages to Russian
  if (msg.includes('Invalid login credentials')) return 'Неверный email или пароль';
  if (msg.includes('Email not confirmed')) return 'Подтвердите email перед входом';
  if (msg.includes('User already registered')) return 'Пользователь с таким email уже существует';
  if (msg.includes('Password should be at least')) return 'Пароль должен содержать минимум 6 символов';
  if (msg.includes('Unable to validate email address')) return 'Некорректный email';
  if (msg.includes('fetch')) return 'Нет соединения с сервером. Проверьте VITE_SUPABASE_URL';
  return msg;
}

// ---- Provider ----
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    // Load existing session on mount
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    if (!isSupabaseConfigured) {
      // Demo mode — simulate success
      setUser({ id: 'demo', email, app_metadata: {}, user_metadata: {}, aud: 'authenticated', created_at: new Date().toISOString() } as User);
      return { error: null };
    }
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error ? formatError(error) : null };
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    if (!isSupabaseConfigured) {
      // Demo mode — any non-empty credentials work
      if (!email || !password) return { error: 'Введите email и пароль' };
      setUser({ id: 'demo', email, app_metadata: {}, user_metadata: {}, aud: 'authenticated', created_at: new Date().toISOString() } as User);
      return { error: null };
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? formatError(error) : null };
  }, []);

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setUser(null);
      setSession(null);
      return;
    }
    await supabase.auth.signOut();
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<AuthResult> => {
    if (!isSupabaseConfigured) return { error: 'Supabase не настроен' };
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    return { error: error ? formatError(error) : null };
  }, []);

  return (
    <AuthContext.Provider value={{
      user, session, loading,
      isConfigured: isSupabaseConfigured,
      signUp, signIn, signOut, signInWithGoogle,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// ---- Hook ----
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
