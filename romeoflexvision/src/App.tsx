import { useEffect } from 'react';
import { LanguageProvider, useLanguage, type Language } from './context/LanguageContext';
import { getSiteContent, SITE_LINKS } from './data/siteContent';
import Landing from './views/Landing';

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
    upsertMetaTag('meta[name="theme-color"]', 'name', 'theme-color', '#f7faff');
    upsertCanonical(canonicalUrl);
  }, [language, site.meta.description, site.meta.ogDescription, site.meta.ogTitle, site.meta.title]);
}

function Shell() {
  const { language } = useLanguage();

  useSiteMeta(language);

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
