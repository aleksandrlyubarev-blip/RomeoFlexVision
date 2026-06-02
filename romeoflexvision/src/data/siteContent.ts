import type { Language } from '../context/LanguageContext';

export const SITE_LINKS = {
  github: 'https://github.com/aleksandrlyubarev-blip/RomeoFlexVision',
  telegram: 'https://t.me/RomeoFlexVision_bot',
  telegramHandle: '@RomeoFlexVision_bot',
  linkedin: 'https://www.linkedin.com/company/romeoflexvision',
  landing: 'https://romeoflexvision.com/',
} as const;

export interface SiteEntity {
  name: string;
  kind: string;
  description: string;
}

export interface SiteCopy {
  meta: {
    title: string;
    description: string;
    ogTitle: string;
    ogDescription: string;
  };
  nav: {
    overview: string;
    entities: string;
    boundary: string;
    github: string;
    contact: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    description: string;
    primaryCta: string;
    secondaryCta: string;
  };
  entities: {
    kicker: string;
    title: string;
    description: string;
    items: SiteEntity[];
  };
  boundary: {
    kicker: string;
    title: string;
    description: string;
    bullets: string[];
  };
  footer: string;
}

const SITE_COPY: Record<Language, SiteCopy> = {
  en: {
    meta: {
      title: 'RomeoFlexVision | Visual inspection research',
      description:
        'RomeoFlexVision is a public research and demo surface for human-reviewed visual inspection workflows.',
      ogTitle: 'RomeoFlexVision | Visual inspection research',
      ogDescription:
        'Public demo surface for visual inspection, evidence logging, and human review.',
    },
    nav: {
      overview: 'Overview',
      entities: 'System map',
      boundary: 'Public boundary',
      github: 'GitHub',
      contact: 'Contact',
    },
    hero: {
      eyebrow: 'RomeoFlexVision',
      title: 'Visual inspection research with a clear public boundary.',
      description:
        'A public demo surface for inspection workflows, evidence logging, and human review. This site does not describe a production customer deployment.',
      primaryCta: 'View public repository',
      secondaryCta: 'Contact',
    },
    entities: {
      kicker: 'System map',
      title: 'Four names. Four distinct roles.',
      description:
        'The public surface uses one stable vocabulary for the hardware, software, manual scanner, and submission wrapper.',
      items: [
        {
          name: 'RoboQC',
          kind: 'Robot hardware',
          description: 'Inspection robot hardware used as the physical capture platform.',
        },
        {
          name: 'Neuron Vision Display',
          kind: 'Software',
          description: 'Visual inspection software for assisted review and evidence logging.',
        },
        {
          name: 'Checker',
          kind: 'Manual scanner',
          description: 'Manual scanning device for operator-led inspection steps.',
        },
        {
          name: 'RomeoFlexVision',
          kind: 'Agent system and submission wrapper',
          description: 'Agent-system and legal wrapper used for the submission.',
        },
      ],
    },
    boundary: {
      kicker: 'Public boundary',
      title: 'Generic examples only.',
      description:
        'The public repository is intentionally limited to reusable research and demo material.',
      bullets: [
        'Public datasets and synthetic examples',
        'Generic inspection concepts',
        'Human review and evidence logging',
        'No customer data, production photos, proprietary layouts, or confidential defect records',
      ],
    },
    footer: 'Public research and demo surface.',
  },
  he: {
    meta: {
      title: 'RomeoFlexVision | מחקר בדיקה חזותית',
      description:
        'RomeoFlexVision היא סביבת מחקר והדגמה ציבורית לתהליכי בדיקה חזותית עם בקרה אנושית.',
      ogTitle: 'RomeoFlexVision | מחקר בדיקה חזותית',
      ogDescription: 'סביבת הדגמה ציבורית לבדיקה חזותית, תיעוד ראיות ובקרה אנושית.',
    },
    nav: {
      overview: 'סקירה',
      entities: 'מפת המערכת',
      boundary: 'גבול ציבורי',
      github: 'GitHub',
      contact: 'יצירת קשר',
    },
    hero: {
      eyebrow: 'RomeoFlexVision',
      title: 'מחקר בדיקה חזותית עם גבול ציבורי ברור.',
      description:
        'סביבת הדגמה ציבורית לתהליכי בדיקה, תיעוד ראיות ובקרה אנושית. האתר אינו מתאר פריסת לקוח בייצור.',
      primaryCta: 'למאגר הציבורי',
      secondaryCta: 'יצירת קשר',
    },
    entities: {
      kicker: 'מפת המערכת',
      title: 'ארבעה שמות. ארבעה תפקידים נפרדים.',
      description: 'השכבה הציבורית משתמשת באוצר מילים יציב לחומרה, תוכנה, סורק ידני ומעטפת ההגשה.',
      items: [
        {
          name: 'RoboQC',
          kind: 'חומרת רובוט',
          description: 'חומרת רובוט בדיקה המשמשת כפלטפורמת צילום פיזית.',
        },
        {
          name: 'Neuron Vision Display',
          kind: 'תוכנה',
          description: 'תוכנת בדיקה חזותית לסקירה מסייעת ותיעוד ראיות.',
        },
        {
          name: 'Checker',
          kind: 'סורק ידני',
          description: 'התקן סריקה ידני לשלבי בדיקה בהובלת מפעיל.',
        },
        {
          name: 'RomeoFlexVision',
          kind: 'מערכת סוכנים ומעטפת הגשה',
          description: 'מערכת סוכנים ומעטפת משפטית המשמשת להגשה.',
        },
      ],
    },
    boundary: {
      kicker: 'גבול ציבורי',
      title: 'דוגמאות כלליות בלבד.',
      description: 'המאגר הציבורי מוגבל בכוונה לחומר מחקר והדגמה לשימוש חוזר.',
      bullets: [
        'מאגרי מידע ציבוריים ודוגמאות סינתטיות',
        'מושגי בדיקה כלליים',
        'בקרה אנושית ותיעוד ראיות',
        'ללא נתוני לקוח, תמונות ייצור, פריסות קנייניות או רשומות פגמים חסויות',
      ],
    },
    footer: 'סביבת מחקר והדגמה ציבורית.',
  },
};

export function getSiteContent(language: Language): SiteCopy {
  return SITE_COPY[language] ?? SITE_COPY.en;
}
