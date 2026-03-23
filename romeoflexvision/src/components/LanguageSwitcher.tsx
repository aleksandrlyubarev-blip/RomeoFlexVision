import { LANGUAGE_META, type Language, useLanguage } from '../context/LanguageContext';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1 backdrop-blur-md">
      {(Object.entries(LANGUAGE_META) as [Language, (typeof LANGUAGE_META)[Language]][]).map(
        ([code, meta]) => (
          <button
            key={code}
            onClick={() => setLanguage(code)}
            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold transition-colors sm:px-3 sm:text-[11px] ${
              language === code
                ? 'bg-accent-blue/20 text-accent-blue'
                : 'text-text-muted hover:text-text-primary'
            }`}
            title={meta.nativeLabel}
          >
            {meta.label}
          </button>
        )
      )}
    </div>
  );
}
