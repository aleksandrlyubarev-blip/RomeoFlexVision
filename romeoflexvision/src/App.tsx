import { useEffect } from 'react';
import { LanguageProvider, useLanguage, type Language } from './context/LanguageContext';
import { getSiteContent, SITE_LINKS } from './data/siteContent';
import Landing from './views/Landing';

type AnalyticsWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  fbq?: ((...args: unknown[]) => void) & {
    queue?: unknown[][];
    loaded?: boolean;
    version?: string;
  };
};

function upsertMetaTag(
  selector: string,
  attribute: 'name' | 'property',
  key: string,
  content: string
) {
  let tag = document.head.querySelector<HTMLMetaElement>(selector);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attribute, key);
    document.head.appendChild(tag);
  }

  tag.setAttribute('content', content);
}

function upsertCanonical(url: string) {
  let tag = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!tag) {
    tag = document.createElement('link');
    tag.setAttribute('rel', 'canonical');
    document.head.appendChild(tag);
  }

  tag.setAttribute('href', url);
}

function appendScriptOnce(id: string, src: string, async = true) {
  if (document.getElementById(id)) {
    return;
  }

  const script = document.createElement('script');
  script.id = id;
  script.src = src;
  script.async = async;
  document.head.appendChild(script);
}

function upsertInlineScript(id: string, content: string) {
  let script = document.getElementById(id) as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement('script');
    script.id = id;
    document.head.appendChild(script);
  }

  script.textContent = content;
}

function useSiteMeta(language: Language) {
  const site = getSiteContent(language);

  useEffect(() => {
    const canonicalUrl =
      language === 'en'
        ? 'https://romeoflexvision.com/'
        : `https://romeoflexvision.com/?lang=${language}`;

    document.title = site.meta.title;
    upsertMetaTag('meta[name="description"]', 'name', 'description', site.meta.description);
    upsertMetaTag('meta[property="og:title"]', 'property', 'og:title', site.meta.ogTitle);
    upsertMetaTag(
      'meta[property="og:description"]',
      'property',
      'og:description',
      site.meta.ogDescription
    );
    upsertMetaTag('meta[property="og:url"]', 'property', 'og:url', canonicalUrl);
    upsertMetaTag(
      'meta[property="og:image"]',
      'property',
      'og:image',
      'https://romeoflexvision.com/og-preview.svg'
    );
    upsertMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    upsertMetaTag('meta[name="theme-color"]', 'name', 'theme-color', '#060b16');
    upsertCanonical(canonicalUrl);
  }, [language, site.meta.description, site.meta.ogDescription, site.meta.ogTitle, site.meta.title]);
}

function useAnalytics() {
  const gaMeasurementId = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim();
  const metaPixelId = import.meta.env.VITE_META_PIXEL_ID?.trim();

  useEffect(() => {
    if (!gaMeasurementId) {
      return;
    }

    const analyticsWindow = window as AnalyticsWindow;
    analyticsWindow.dataLayer = analyticsWindow.dataLayer ?? [];
    analyticsWindow.gtag =
      analyticsWindow.gtag ??
      ((...args: unknown[]) => {
        analyticsWindow.dataLayer?.push(args);
      });

    appendScriptOnce('rfv-ga-src', `https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`);
    upsertInlineScript(
      'rfv-ga-inline',
      [
        'window.dataLayer = window.dataLayer || [];',
        'function gtag(){dataLayer.push(arguments);}',
        "gtag('js', new Date());",
        `gtag('config', '${gaMeasurementId}');`,
      ].join('\n')
    );
  }, [gaMeasurementId]);

  useEffect(() => {
    if (!metaPixelId) {
      return;
    }

    const analyticsWindow = window as AnalyticsWindow;
    if (!analyticsWindow.fbq) {
      const fbq: NonNullable<AnalyticsWindow['fbq']> = ((...args: unknown[]) => {
        fbq.queue = fbq.queue ?? [];
        fbq.queue.push(args);
      }) as NonNullable<AnalyticsWindow['fbq']>;

      fbq.queue = [];
      fbq.loaded = true;
      fbq.version = '2.0';
      analyticsWindow.fbq = fbq;
      appendScriptOnce('rfv-meta-pixel-src', 'https://connect.facebook.net/en_US/fbevents.js');
    }

    analyticsWindow.fbq?.('init', metaPixelId);
    analyticsWindow.fbq?.('track', 'PageView');
  }, [metaPixelId]);
}

function Shell() {
  const { language } = useLanguage();

  useSiteMeta(language);
  useAnalytics();

  return (
    <Landing
      onPilotLaunch={() => {
        window.open(SITE_LINKS.telegram, '_blank', 'noopener,noreferrer');
      }}
    />
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <Shell />
    </LanguageProvider>
  );
}
