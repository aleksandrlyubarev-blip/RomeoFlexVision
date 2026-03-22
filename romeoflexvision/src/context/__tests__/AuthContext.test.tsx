import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { AuthProvider, useAuth } from '../AuthContext';

// Demo mode: isSupabaseConfigured = false
vi.mock('../../lib/supabase', () => ({
  isSupabaseConfigured: false,
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      signInWithOAuth: vi.fn(),
    },
  },
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('useAuth — throws outside AuthProvider', () => {
  it('throws when used without AuthProvider', () => {
    expect(() => renderHook(() => useAuth())).toThrow('useAuth must be used inside AuthProvider');
  });
});

describe('AuthContext — demo mode (isSupabaseConfigured = false)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts with no user and loading=false', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    // Wait for the useEffect to finish
    await act(async () => {});
    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.isConfigured).toBe(false);
  });

  it('signIn with valid credentials sets the demo user', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {});

    let authResult: { error: string | null };
    await act(async () => {
      authResult = await result.current.signIn('user@test.com', 'pass123');
    });

    expect(authResult!.error).toBeNull();
    expect(result.current.user?.email).toBe('user@test.com');
    expect(result.current.user?.id).toBe('demo');
  });

  it('signIn with empty email returns error', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {});

    let authResult: { error: string | null };
    await act(async () => {
      authResult = await result.current.signIn('', 'pass123');
    });

    expect(authResult!.error).toBe('Введите email и пароль');
    expect(result.current.user).toBeNull();
  });

  it('signIn with empty password returns error', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {});

    let authResult: { error: string | null };
    await act(async () => {
      authResult = await result.current.signIn('user@test.com', '');
    });

    expect(authResult!.error).toBe('Введите email и пароль');
    expect(result.current.user).toBeNull();
  });

  it('signUp sets the demo user and returns no error', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {});

    let authResult: { error: string | null };
    await act(async () => {
      authResult = await result.current.signUp('new@user.com', 'secret123');
    });

    expect(authResult!.error).toBeNull();
    expect(result.current.user?.email).toBe('new@user.com');
  });

  it('signOut clears user and session', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {});

    // Sign in first
    await act(async () => {
      await result.current.signIn('user@test.com', 'pass');
    });
    expect(result.current.user).not.toBeNull();

    // Then sign out
    await act(async () => {
      await result.current.signOut();
    });
    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();
  });

  it('signInWithGoogle returns Supabase-not-configured error', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {});

    let authResult: { error: string | null };
    await act(async () => {
      authResult = await result.current.signInWithGoogle();
    });

    expect(authResult!.error).toBe('Supabase не настроен');
  });
});
