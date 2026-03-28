import { LANGUAGE_META, type Language, useLanguage } from '../context/LanguageContext';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="site-language-switcher">
      {(Object.entries(LANGUAGE_META) as [Language, (typeof LANGUAGE_META)[Language]][]).map(
        ([code, meta]) => (
          <button
            key={code}
            onClick={() => setLanguage(code)}
            className={language === code ? 'is-active' : undefined}
            title={meta.nativeLabel}
          >
            {meta.label}
          </button>
        )
      )}
    </div>
  );
}
