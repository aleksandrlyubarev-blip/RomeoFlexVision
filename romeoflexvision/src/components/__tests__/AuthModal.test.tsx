import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuthModal from '../AuthModal';

const mockSignIn = vi.fn();
const mockSignUp = vi.fn();
const mockSignInWithGoogle = vi.fn();

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    signIn: mockSignIn,
    signUp: mockSignUp,
    signInWithGoogle: mockSignInWithGoogle,
    isConfigured: false,
  }),
}));

function renderModal(props: Partial<React.ComponentProps<typeof AuthModal>> = {}) {
  return render(<AuthModal onClose={vi.fn()} {...props} />);
}

/** Clicks the form submit button (not the tab-switcher button). */
function submitForm(container: HTMLElement) {
  const form = container.querySelector('form')!;
  fireEvent.submit(form);
}

describe('AuthModal — demo mode notice', () => {
  it('shows demo mode notice when isConfigured=false', () => {
    renderModal();
    expect(screen.getByText('Демо-режим')).toBeInTheDocument();
  });
});

describe('AuthModal — login tab validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignIn.mockResolvedValue({ error: null });
  });

  it('shows error when email is empty', async () => {
    const { container } = renderModal({ initialTab: 'login' });
    submitForm(container);
    expect(await screen.findByText('Введите email')).toBeInTheDocument();
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('shows error when password is empty', async () => {
    const user = userEvent.setup();
    const { container } = renderModal({ initialTab: 'login' });
    await user.type(screen.getByPlaceholderText('operator@company.com'), 'a@b.com');
    submitForm(container);
    expect(await screen.findByText('Введите пароль')).toBeInTheDocument();
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('calls signIn and triggers onSuccess + onClose on success', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onSuccess = vi.fn();
    const { container } = renderModal({ initialTab: 'login', onClose, onSuccess });

    await user.type(screen.getByPlaceholderText('operator@company.com'), 'a@b.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'pass123');
    submitForm(container);

    expect(mockSignIn).toHaveBeenCalledWith('a@b.com', 'pass123');
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(onSuccess).toHaveBeenCalled();
  });

  it('shows API error returned from signIn', async () => {
    mockSignIn.mockResolvedValue({ error: 'Неверный email или пароль' });
    const user = userEvent.setup();
    const { container } = renderModal({ initialTab: 'login' });

    await user.type(screen.getByPlaceholderText('operator@company.com'), 'a@b.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'wrongpass');
    submitForm(container);

    expect(await screen.findByText('Неверный email или пароль')).toBeInTheDocument();
  });

  it('clears error when switching tabs', async () => {
    const user = userEvent.setup();
    const { container } = renderModal({ initialTab: 'login' });

    // Trigger an error on login tab
    submitForm(container);
    expect(await screen.findByText('Введите email')).toBeInTheDocument();

    // Switch to register tab by clicking the tab button
    await user.click(screen.getByRole('button', { name: 'Регистрация' }));

    // Error should be gone
    expect(screen.queryByText('Введите email')).not.toBeInTheDocument();
  });
});

describe('AuthModal — register tab validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignUp.mockResolvedValue({ error: null });
  });

  it('shows error when password is too short', async () => {
    const user = userEvent.setup();
    const { container } = renderModal({ initialTab: 'register' });

    await user.type(screen.getByPlaceholderText('operator@company.com'), 'a@b.com');
    const passwordInputs = screen.getAllByPlaceholderText('••••••••');
    await user.type(passwordInputs[0], 'abc');
    await user.type(passwordInputs[1], 'abc');
    submitForm(container);

    expect(await screen.findByText('Пароль должен содержать минимум 6 символов')).toBeInTheDocument();
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('shows error when passwords do not match', async () => {
    const user = userEvent.setup();
    const { container } = renderModal({ initialTab: 'register' });

    await user.type(screen.getByPlaceholderText('operator@company.com'), 'a@b.com');
    const passwordInputs = screen.getAllByPlaceholderText('••••••••');
    await user.type(passwordInputs[0], 'abcdef');
    await user.type(passwordInputs[1], 'xxxxxx');
    submitForm(container);

    expect(await screen.findByText('Пароли не совпадают')).toBeInTheDocument();
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('calls signUp and closes immediately in demo mode', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onSuccess = vi.fn();
    const { container } = renderModal({ initialTab: 'register', onClose, onSuccess });

    await user.type(screen.getByPlaceholderText('operator@company.com'), 'new@user.com');
    const passwordInputs = screen.getAllByPlaceholderText('••••••••');
    await user.type(passwordInputs[0], 'pass123');
    await user.type(passwordInputs[1], 'pass123');
    submitForm(container);

    expect(mockSignUp).toHaveBeenCalledWith('new@user.com', 'pass123');
    // isConfigured=false → demo mode → closes immediately
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(onSuccess).toHaveBeenCalled();
  });
});

describe('AuthModal — Google sign-in', () => {
  it('does not render Google button when isConfigured=false', () => {
    renderModal();
    expect(screen.queryByText('Войти через Google')).not.toBeInTheDocument();
  });
});
