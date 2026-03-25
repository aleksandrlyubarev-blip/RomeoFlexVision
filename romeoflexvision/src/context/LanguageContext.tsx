/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type Language = 'en' | 'ru' | 'he';

const LANGUAGE_STORAGE_KEY = 'roboqc-language';

export const LANGUAGE_META: Record<
  Language,
  { label: string; nativeLabel: string; locale: string; dir: 'ltr' | 'rtl' }
> = {
  en: { label: 'EN', nativeLabel: 'English', locale: 'en-US', dir: 'ltr' },
  ru: { label: 'RU', nativeLabel: 'Русский', locale: 'ru-RU', dir: 'ltr' },
  he: { label: 'HE', nativeLabel: 'עברית', locale: 'he-IL', dir: 'rtl' },
};

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  locale: string;
  dir: 'ltr' | 'rtl';
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function resolveInitialLanguage(): Language {
  if (typeof window === 'undefined') {
    return 'en';
  }

  const searchLanguage = new URLSearchParams(window.location.search).get('lang');
  if (searchLanguage === 'en' || searchLanguage === 'ru' || searchLanguage === 'he') {
    return searchLanguage;
  }

  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (stored === 'en' || stored === 'ru' || stored === 'he') {
    return stored;
  }

  return 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(resolveInitialLanguage);
  const meta = LANGUAGE_META[language];

  useEffect(() => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    document.documentElement.lang = language;
    document.documentElement.dir = meta.dir;

    const url = new URL(window.location.href);
    if (language === 'en') {
      url.searchParams.delete('lang');
    } else {
      url.searchParams.set('lang', language);
    }
    window.history.replaceState({}, '', url);
  }, [language, meta.dir]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      locale: meta.locale,
      dir: meta.dir,
    }),
    [language, meta.dir, meta.locale]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used inside LanguageProvider');
  }
  return context;
}
