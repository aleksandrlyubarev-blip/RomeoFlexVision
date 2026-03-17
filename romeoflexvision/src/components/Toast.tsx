import { useToast } from '../context/ToastContext';

const STYLES: Record<string, string> = {
  success: 'border-accent-cyan text-accent-cyan',
  error:   'border-signal-alert text-signal-alert',
  warning: 'border-signal-warning text-signal-warning',
  info:    'border-accent-blue text-accent-blue',
};

const ICON: Record<string, string> = {
  success: '✓', error: '✕', warning: '⚠', info: 'ℹ',
};

export default function ToastContainer() {
  const { toasts, dismiss } = useToast();
  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg bg-bg-card border ${STYLES[t.type]} shadow-lg text-sm min-w-[260px] max-w-xs animate-fade-in`}
        >
          <span className="shrink-0 text-base">{ICON[t.type]}</span>
          <span className="flex-1 text-text-primary">{t.message}</span>
          <button onClick={() => dismiss(t.id)} className="shrink-0 opacity-40 hover:opacity-70 text-text-primary transition-opacity">✕</button>
        </div>
      ))}
    </div>
  );
}
