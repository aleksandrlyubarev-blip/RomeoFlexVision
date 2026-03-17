import { createContext, useContext, useState } from 'react';
import { translations } from '../i18n/translations';
import type { Locale, TranslationKeys } from '../i18n/translations';

const LS_KEY = 'rfv_locale';

function getInitialLocale(): Locale {
  const stored = localStorage.getItem(LS_KEY);
  return stored === 'en' ? 'en' : 'ru';
}

interface I18nContextValue {
  locale: Locale;
  t: TranslationKeys;
  setLocale: (l: Locale) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);

  const setLocale = (l: Locale) => {
    localStorage.setItem(LS_KEY, l);
    setLocaleState(l);
  };

  return (
    <I18nContext.Provider value={{ locale, t: translations[locale] as TranslationKeys, setLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be inside I18nProvider');
  return ctx;
}
