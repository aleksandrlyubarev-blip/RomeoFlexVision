import { describe, it, expect } from 'vitest';
import { formatError } from '../AuthContext';

describe('formatError', () => {
  it('returns fallback for null/falsy input', () => {
    expect(formatError(null)).toBe('Неизвестная ошибка');
    expect(formatError(undefined)).toBe('Неизвестная ошибка');
    expect(formatError(0)).toBe('Неизвестная ошибка');
  });

  it('translates Invalid login credentials', () => {
    expect(formatError({ message: 'Invalid login credentials' })).toBe('Неверный email или пароль');
  });

  it('translates Email not confirmed', () => {
    expect(formatError({ message: 'Email not confirmed' })).toBe('Подтвердите email перед входом');
  });

  it('translates User already registered', () => {
    expect(formatError({ message: 'User already registered' })).toBe('Пользователь с таким email уже существует');
  });

  it('translates Password should be at least', () => {
    expect(formatError({ message: 'Password should be at least 6 characters' })).toBe('Пароль должен содержать минимум 6 символов');
  });

  it('translates Unable to validate email address', () => {
    expect(formatError({ message: 'Unable to validate email address: invalid format' })).toBe('Некорректный email');
  });

  it('translates fetch/network errors', () => {
    expect(formatError({ message: 'Failed to fetch' })).toBe('Нет соединения с сервером. Проверьте VITE_SUPABASE_URL');
  });

  it('returns the raw message for unknown errors', () => {
    expect(formatError({ message: 'Some unexpected error from server' })).toBe('Some unexpected error from server');
  });

  it('handles plain Error objects', () => {
    expect(formatError(new Error('Invalid login credentials'))).toBe('Неверный email или пароль');
  });

  it('handles string errors via String() coercion', () => {
    const result = formatError('raw string error');
    // No message property, so falls through to String(err)
    expect(typeof result).toBe('string');
  });
});
