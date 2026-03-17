import { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../i18n/translations';
import type { Locale, TranslationKeys } from '../i18n/translations';

const LS_KEY = 'rfv_locale';
const RTL_LOCALES: Locale[] = ['he'];

function getInitialLocale(): Locale {
  const stored = localStorage.getItem(LS_KEY) as Locale | null;
  return stored && stored in translations ? stored : 'ru';
}

interface I18nContextValue {
  locale: Locale;
  t: TranslationKeys;
  isRtl: boolean;
  setLocale: (l: Locale) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);
  const isRtl = RTL_LOCALES.includes(locale);

  // Apply dir="rtl" to <html> for RTL languages
  useEffect(() => {
    document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', locale);
  }, [locale, isRtl]);

  const setLocale = (l: Locale) => {
    localStorage.setItem(LS_KEY, l);
    setLocaleState(l);
  };

  return (
    <I18nContext.Provider value={{ locale, t: translations[locale] as TranslationKeys, isRtl, setLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be inside I18nProvider');
  return ctx;
}
