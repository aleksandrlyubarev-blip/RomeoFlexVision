import type { Language } from '../context/LanguageContext';

export const SITE_LINKS = {
  github: 'https://github.com/aleksandrlyubarev-blip/RomeoFlexVision',
  telegram: 'https://t.me/RomeoFlexVision_bot',
  telegramHandle: '@RomeoFlexVision_bot',
  linkedin: 'https://www.linkedin.com/company/romeoflexvision',
  landing: 'https://romeoflexvision.com/',
} as const;

export interface SiteMetric {
  label: string;
  value: number;
  suffix: string;
}

export interface SiteStoryCard {
  title: string;
  description: string;
}

export interface SitePain {
  title: string;
  description: string;
}

export interface SiteComparisonCell {
  label: string;
  tone: 'strong' | 'mid' | 'weak';
}

export interface SiteComparisonRow {
  capability: string;
  values: SiteComparisonCell[];
}

export interface SiteLinkCard {
  title: string;
  description: string;
  href: string;
  action: string;
}

export interface SiteFaqItem {
  question: string;
  answer: string;
}

export interface SiteRoadmapItem {
  phase: string;
  title: string;
  description: string;
  status: string;
  tone: 'success' | 'warning' | 'info';
}

interface SiteMetaCopy {
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
}

interface SiteNavCopy {
  story: string;
  pains: string;
  comparison: string;
  roadmap: string;
  contact: string;
  github: string;
  telegram: string;
  linkedin: string;
  pilot: string;
  menu: string;
  close: string;
}

interface SiteHeroCopy {
  eyebrow: string;
  title: string;
  subtitle: string;
  primaryCta: string;
  secondaryCta: string;
  badges: string[];
  imageBadge: string;
  imageStat: string;
  imageAlt: string;
}

interface SiteSectionCopy {
  story: string;
  storyDescription: string;
  pains: string;
  painsDescription: string;
  comparison: string;
  comparisonDescription: string;
  roadmap: string;
  roadmapDescription: string;
  community: string;
  communityDescription: string;
  faq: string;
  faqDescription: string;
}

interface SiteLabelCopy {
  poweredBy: string;
  comparisonColumns: string[];
  footerSummary: string;
  footerNote: string;
  rights: string;
}

interface SiteUiCopy {
  liveLabel: string;
  proofLabel: string;
  proofTitle: string;
  proofDescription: string;
  storyQuote: string;
  capabilityLabel: string;
  socialLabel: string;
  brandGuideLabel: string;
  faqKicker: string;
}

export interface SiteCopy {
  meta: SiteMetaCopy;
  nav: SiteNavCopy;
  hero: SiteHeroCopy;
  sections: SiteSectionCopy;
  labels: SiteLabelCopy;
  ui: SiteUiCopy;
  metrics: SiteMetric[];
  storyCards: SiteStoryCard[];
  pains: SitePain[];
  comparisonRows: SiteComparisonRow[];
  roadmap: SiteRoadmapItem[];
  communityCards: SiteLinkCard[];
  faq: SiteFaqItem[];
}

const SITE_COPY: Record<Language, SiteCopy> = {
  en: {
    meta: {
      title: 'RoboQC | Cognitive Quality Inspector',
      description:
        'RoboQC is the cognitive robot-inspector powered by Romeo FlexVision. Catch station-2 defects in real time instead of discovering them at test #5.',
      ogTitle: 'RoboQC | Powered by Romeo FlexVision',
      ogDescription:
        'The robot-camera that never sleeps. Inline quality control for station-level defects.',
    },
    nav: {
      story: 'Why RoboQC',
      pains: '5 Pain Points',
      comparison: 'Comparison',
      roadmap: 'Roadmap',
      contact: 'Contact',
      github: 'GitHub',
      telegram: 'Telegram',
      linkedin: 'LinkedIn',
      pilot: 'Open pilot chat',
      menu: 'Menu',
      close: 'Close',
    },
    hero: {
      eyebrow: 'Powered by Romeo FlexVision',
      title: 'RoboQC. Your camera-robot on every station.',
      subtitle: 'Inline quality control. We catch 90% of errors in real time.',
      primaryCta: 'Open pilot chat',
      secondaryCta: 'See the comparison',
      badges: ['24/7 inline monitoring', 'Station #2 response loop', 'Evidence before escalation'],
      imageBadge: 'Robot camera. Never sleeps.',
      imageStat: 'Station #2 alert in seconds',
      imageAlt: 'Romeo inspection robot on a production line',
    },
    sections: {
      story: 'A QC robot for the exact moment defects are born',
      storyDescription:
        'RoboQC works on the station itself: camera, evidence, and escalation loop in one operator-facing surface.',
      pains: '5 pains RoboQC removes overnight',
      painsDescription:
        'The goal is simple: stop paying for defects discovered too late, without proof frames and without a clean handoff to the line.',
      comparison: 'Romeo FlexVision vs LightGuide, Arkite, Drishti, Retrocausal',
      comparisonDescription:
        'RoboQC is positioned around inline defect capture and operator evidence, not just guidance, analytics, or after-the-fact reporting.',
      roadmap: 'Rollout roadmap',
      roadmapDescription:
        'A practical path from one pilot station to multi-station inline quality coverage.',
      community: 'Pilot launch, repositories, and public touchpoints',
      communityDescription:
        'Use Telegram for a fast pilot intro, GitHub for the build surface, and LinkedIn for external positioning.',
      faq: 'FAQ',
      faqDescription: 'Short answers for operators, engineering managers, and pilot sponsors.',
    },
    labels: {
      poweredBy: 'Powered by Romeo FlexVision',
      comparisonColumns: ['RoboQC', 'LightGuide', 'Arkite', 'Drishti', 'Retrocausal'],
      footerSummary:
        'RoboQC is a cognitive quality-control robot built on top of the Romeo FlexVision stack.',
      footerNote:
        'The robot-camera that catches defects on station #2 instead of discovering them at test #5.',
      rights: '(c) 2026 RoboQC. All rights reserved.',
    },
    ui: {
      liveLabel: 'RoboQC live',
      proofLabel: 'Inline proof',
      proofTitle: 'Frame, trace, decision',
      proofDescription:
        'Catch the defect where it starts, with evidence the line can use right away.',
      storyQuote: '"The robot-camera that never sleeps."',
      capabilityLabel: 'Capability',
      socialLabel: 'Links',
      brandGuideLabel: 'Brand guide',
      faqKicker: 'FAQ',
    },
    metrics: [
      { label: 'Errors caught in real time', value: 90, suffix: '%' },
      { label: 'Monitoring coverage', value: 24, suffix: '/7' },
      { label: 'Primary pilot station', value: 2, suffix: '' },
      { label: 'Seconds to operator alert', value: 8, suffix: 's' },
    ],
    storyCards: [
      {
        title: 'Camera-first inspection',
        description:
          'The system watches the station itself, so quality teams react where the process actually drifts.',
      },
      {
        title: 'Evidence before escalation',
        description:
          'Every alert ships with a frame, context, and confidence so the line sees what changed.',
      },
      {
        title: 'Designed for the line',
        description:
          'The product is framed around operator action, not just offline analytics or reporting decks.',
      },
    ],
    pains: [
      {
        title: 'Defects found too late',
        description: 'RoboQC pulls discovery forward to the station instead of waiting for late tests.',
      },
      {
        title: 'No proof frame',
        description: 'Each alert can carry visual evidence instead of a vague signal or spreadsheet note.',
      },
      {
        title: 'Tired manual inspection',
        description: 'The robot-camera keeps watching even when shift attention drops.',
      },
      {
        title: 'Slow escalation',
        description: 'Operators get a usable signal immediately while the part is still in the process.',
      },
      {
        title: 'Weak root-cause trace',
        description: 'Alerts stay tied to the station context so engineering can review real defect history.',
      },
    ],
    comparisonRows: [
      {
        capability: 'Inline defect catch on the station',
        values: [
          { label: 'Built for it', tone: 'strong' },
          { label: 'Guidance-heavy', tone: 'weak' },
          { label: 'Assembly focus', tone: 'weak' },
          { label: 'Analytics focus', tone: 'mid' },
          { label: 'Optimization focus', tone: 'weak' },
        ],
      },
      {
        capability: 'Evidence frame with traceability',
        values: [
          { label: 'Operator ready', tone: 'strong' },
          { label: 'Partial', tone: 'mid' },
          { label: 'Partial', tone: 'mid' },
          { label: 'Analytics first', tone: 'mid' },
          { label: 'Not core', tone: 'weak' },
        ],
      },
      {
        capability: 'Fast pilot on one station',
        values: [
          { label: 'Pilot-first', tone: 'strong' },
          { label: 'Requires program setup', tone: 'mid' },
          { label: 'Requires rollout design', tone: 'mid' },
          { label: 'Data-heavy setup', tone: 'weak' },
          { label: 'Broader optimization scope', tone: 'weak' },
        ],
      },
      {
        capability: 'Camera + escalation loop in one surface',
        values: [
          { label: 'Unified', tone: 'strong' },
          { label: 'Guidance-centric', tone: 'weak' },
          { label: 'Workflow-centric', tone: 'mid' },
          { label: 'Dashboard-centric', tone: 'weak' },
          { label: 'Model-centric', tone: 'weak' },
        ],
      },
      {
        capability: 'Designed around station #2, not test #5',
        values: [
          { label: 'Core message', tone: 'strong' },
          { label: 'Not core', tone: 'weak' },
          { label: 'Not core', tone: 'weak' },
          { label: 'Not core', tone: 'weak' },
          { label: 'Not core', tone: 'weak' },
        ],
      },
    ],
    roadmap: [
      {
        phase: 'Now',
        title: 'Single-station pilot',
        description:
          'Connect one camera loop, one defect family, and one operator workflow to prove value quickly.',
        status: 'Ready for pilot',
        tone: 'success',
      },
      {
        phase: 'Next',
        title: 'Evidence pack and reporting loop',
        description:
          'Standardize frame capture, confidence, trace, and escalation notes into one usable package.',
        status: 'In rollout',
        tone: 'info',
      },
      {
        phase: 'Next',
        title: 'Root-cause review by station',
        description:
          'Aggregate repeated defects by station, shift, and part family so engineering sees the real failure point.',
        status: 'Active analytics',
        tone: 'info',
      },
      {
        phase: 'Later',
        title: 'Multi-station orchestration',
        description:
          'Expand the same evidence loop across multiple stations without scaling manual inspection headcount.',
        status: 'Expansion stage',
        tone: 'warning',
      },
    ],
    communityCards: [
      {
        title: 'GitHub',
        description: 'Repository, landing source, and the current public build surface for RoboQC.',
        href: SITE_LINKS.github,
        action: 'Open GitHub',
      },
      {
        title: 'Telegram Bot',
        description: 'Fastest public entry point for pilot intros, demos, and inbound requests.',
        href: SITE_LINKS.telegram,
        action: 'Open Telegram',
      },
      {
        title: 'LinkedIn',
        description: 'External positioning updates and company narrative around Romeo FlexVision.',
        href: SITE_LINKS.linkedin,
        action: 'Open LinkedIn',
      },
    ],
    faq: [
      {
        question: 'What is RoboQC in one sentence?',
        answer:
          'RoboQC is a cognitive robot-inspector for inline quality control, powered by the Romeo FlexVision vision stack.',
      },
      {
        question: 'What happens during a pilot?',
        answer:
          'A pilot usually focuses on one station, one camera loop, and one defect family so the team can prove value fast.',
      },
      {
        question: 'Why mention station #2 and test #5?',
        answer:
          'Because the product is framed around catching the defect where it is created, not where it becomes expensive.',
      },
      {
        question: 'Does the site open a real product app?',
        answer:
          'Not yet. The public site is currently a clean corporate landing that routes pilots and conversations through Telegram.',
      },
    ],
  },
  ru: {
    meta: {
      title: 'RoboQC | Когнитивный QC-робот',
      description:
        'RoboQC — когнитивный робот-инспектор качества на базе Romeo FlexVision. Ловит ошибки на станции №2 в реальном времени, а не на тесте №5.',
      ogTitle: 'RoboQC | powered by Romeo FlexVision',
      ogDescription:
        'Робот-камера, которая никогда не спит. Inline-контроль качества на уровне станции.',
    },
    nav: {
      story: 'Почему RoboQC',
      pains: '5 болей',
      comparison: 'Сравнение',
      roadmap: 'Роадмап',
      contact: 'Контакты',
      github: 'GitHub',
      telegram: 'Telegram',
      linkedin: 'LinkedIn',
      pilot: 'Открыть пилотный чат',
      menu: 'Меню',
      close: 'Закрыть',
    },
    hero: {
      eyebrow: 'Powered by Romeo FlexVision',
      title: 'RoboQC. Твой робот-камера на каждой станции.',
      subtitle: 'Inline-контроль качества. 90% ошибок ловим в реальном времени.',
      primaryCta: 'Открыть пилотный чат',
      secondaryCta: 'Смотреть сравнение',
      badges: ['24/7 inline-мониторинг', 'Контур реакции на станции №2', 'Доказательство до эскалации'],
      imageBadge: 'Робот-камера. Никогда не спит.',
      imageStat: 'Алерт со станции №2 за секунды',
      imageAlt: 'Робот Romeo на производственной линии',
    },
    sections: {
      story: 'QC-робот для момента, когда дефект только рождается',
      storyDescription:
        'RoboQC работает прямо на станции: камера, доказательство и контур эскалации в одной поверхности для оператора.',
      pains: '5 болей, которые RoboQC забирает за одну ночь',
      painsDescription:
        'Задача простая: перестать платить за дефекты, которые находят слишком поздно, без proof-frame и без нормальной передачи в линию.',
      comparison: 'Romeo FlexVision vs LightGuide, Arkite, Drishti, Retrocausal',
      comparisonDescription:
        'RoboQC сфокусирован на inline-поимке дефекта и доказательстве для оператора, а не только на инструкциях, аналитике или отчётности постфактум.',
      roadmap: 'Роадмап запуска',
      roadmapDescription:
        'Практичный путь от пилота на одной станции к покрытию нескольких станций без перестройки всего производства.',
      community: 'Пилот, репозитории и публичные точки входа',
      communityDescription:
        'Telegram даёт быстрый вход в пилот, GitHub показывает текущую сборку, а LinkedIn держит внешний позиционинг.',
      faq: 'FAQ',
      faqDescription: 'Короткие ответы для операторов, инженеров и спонсоров пилота.',
    },
    labels: {
      poweredBy: 'Powered by Romeo FlexVision',
      comparisonColumns: ['RoboQC', 'LightGuide', 'Arkite', 'Drishti', 'Retrocausal'],
      footerSummary:
        'RoboQC — когнитивный робот контроля качества, построенный на технологическом стеке Romeo FlexVision.',
      footerNote:
        'Робот-камера, который ловит дефекты на станции №2, а не обнаруживает их только на тесте №5.',
      rights: '(c) 2026 RoboQC. Все права защищены.',
    },
    ui: {
      liveLabel: 'RoboQC в линии',
      proofLabel: 'Inline-доказательство',
      proofTitle: 'Кадр, trace, решение',
      proofDescription:
        'Ловим дефект там, где он появляется, и сразу даём линии понятное доказательство для действия.',
      storyQuote: '"Робот-камера, которая никогда не спит."',
      capabilityLabel: 'Возможность',
      socialLabel: 'Ссылки',
      brandGuideLabel: 'Бренд-гайд',
      faqKicker: 'FAQ',
    },
    metrics: [
      { label: 'Ошибок ловим в реальном времени', value: 90, suffix: '%' },
      { label: 'Покрытие мониторинга', value: 24, suffix: '/7' },
      { label: 'Базовая пилотная станция', value: 2, suffix: '' },
      { label: 'Секунды до алерта оператору', value: 8, suffix: 'с' },
    ],
    storyCards: [
      {
        title: 'Инспекция начинается с камеры',
        description:
          'Система смотрит прямо на станцию, поэтому команда качества реагирует там, где процесс реально уходит от нормы.',
      },
      {
        title: 'Сначала доказательство',
        description:
          'Каждый алерт несёт кадр, контекст и confidence, а не абстрактный сигнал без объяснения.',
      },
      {
        title: 'Спроектировано под линию',
        description:
          'Продукт заточен под действие оператора, а не под красивую аналитику после смены.',
      },
    ],
    pains: [
      {
        title: 'Дефекты находят слишком поздно',
        description: 'RoboQC переносит момент обнаружения на станцию, а не ждёт поздний тест.',
      },
      {
        title: 'Нет proof-frame',
        description: 'Каждый алерт может нести визуальное доказательство, а не просто строку в таблице.',
      },
      {
        title: 'Усталый ручной контроль',
        description: 'Робот-камера продолжает смотреть, даже когда у смены падает концентрация.',
      },
      {
        title: 'Медленная эскалация',
        description: 'Оператор получает пригодный к действию сигнал, пока деталь ещё находится в процессе.',
      },
      {
        title: 'Слабый root-cause trace',
        description:
          'Алерты остаются привязанными к контексту станции, чтобы инженерия видела реальную историю дефекта.',
      },
    ],
    comparisonRows: [
      {
        capability: 'Inline-поимка дефекта на станции',
        values: [
          { label: 'Ключевой сценарий', tone: 'strong' },
          { label: 'Больше про инструкции', tone: 'weak' },
          { label: 'Больше про сборку', tone: 'weak' },
          { label: 'Больше про аналитику', tone: 'mid' },
          { label: 'Больше про оптимизацию', tone: 'weak' },
        ],
      },
      {
        capability: 'Кадр-доказательство и traceability',
        values: [
          { label: 'Готово для оператора', tone: 'strong' },
          { label: 'Частично', tone: 'mid' },
          { label: 'Частично', tone: 'mid' },
          { label: 'Сначала аналитика', tone: 'mid' },
          { label: 'Не core', tone: 'weak' },
        ],
      },
      {
        capability: 'Быстрый пилот на одной станции',
        values: [
          { label: 'Pilot-first', tone: 'strong' },
          { label: 'Нужна программа внедрения', tone: 'mid' },
          { label: 'Нужен rollout-дизайн', tone: 'mid' },
          { label: 'Тяжёлый data-setup', tone: 'weak' },
          { label: 'Широкий scope', tone: 'weak' },
        ],
      },
      {
        capability: 'Камера и эскалация в одном контуре',
        values: [
          { label: 'Единая поверхность', tone: 'strong' },
          { label: 'Instruction-centric', tone: 'weak' },
          { label: 'Workflow-centric', tone: 'mid' },
          { label: 'Dashboard-centric', tone: 'weak' },
          { label: 'Model-centric', tone: 'weak' },
        ],
      },
      {
        capability: 'Логика station #2, а не test #5',
        values: [
          { label: 'Основа позиционинга', tone: 'strong' },
          { label: 'Не core', tone: 'weak' },
          { label: 'Не core', tone: 'weak' },
          { label: 'Не core', tone: 'weak' },
          { label: 'Не core', tone: 'weak' },
        ],
      },
    ],
    roadmap: [
      {
        phase: 'Сейчас',
        title: 'Пилот на одной станции',
        description:
          'Подключаем одну камеру, одно семейство дефектов и один операторский контур, чтобы быстро доказать ценность.',
        status: 'Готово к пилоту',
        tone: 'success',
      },
      {
        phase: 'Следом',
        title: 'Evidence pack и контур отчётности',
        description:
          'Собираем frame capture, confidence, trace и escalation notes в один пакет, пригодный для линии.',
        status: 'В развёртывании',
        tone: 'info',
      },
      {
        phase: 'Следом',
        title: 'Root-cause review по станциям',
        description:
          'Собираем повторяемые дефекты по станциям, сменам и семействам деталей, чтобы инженерия видела реальную точку срыва.',
        status: 'Активная аналитика',
        tone: 'info',
      },
      {
        phase: 'Дальше',
        title: 'Оркестрация нескольких станций',
        description:
          'Расширяем тот же evidence loop на несколько станций без наращивания ручного инспекционного контура.',
        status: 'Этап масштабирования',
        tone: 'warning',
      },
    ],
    communityCards: [
      {
        title: 'GitHub',
        description: 'Репозиторий, исходники лендинга и текущая публичная сборка RoboQC.',
        href: SITE_LINKS.github,
        action: 'Открыть GitHub',
      },
      {
        title: 'Telegram Bot',
        description: 'Самая быстрая публичная точка входа для пилота, демо и входящих запросов.',
        href: SITE_LINKS.telegram,
        action: 'Открыть Telegram',
      },
      {
        title: 'LinkedIn',
        description: 'Внешние апдейты позиционирования и narrative вокруг Romeo FlexVision.',
        href: SITE_LINKS.linkedin,
        action: 'Открыть LinkedIn',
      },
    ],
    faq: [
      {
        question: 'Что такое RoboQC в одном предложении?',
        answer:
          'RoboQC — когнитивный робот-инспектор для inline-контроля качества, работающий на vision-стеке Romeo FlexVision.',
      },
      {
        question: 'Что входит в пилот?',
        answer:
          'Обычно это одна станция, один контур камеры и одно семейство дефектов, чтобы быстро доказать ценность без лишней сложности.',
      },
      {
        question: 'Почему акцент на станции №2 и тесте №5?',
        answer:
          'Потому что продукт построен вокруг идеи ловить дефект там, где он рождается, а не там, где он уже стал дорогим.',
      },
      {
        question: 'Открывается ли сейчас реальное продуктовое приложение?',
        answer:
          'Пока нет. Публичный сайт сейчас специально упрощён до корпоративного лендинга и ведёт в пилотный Telegram-контур.',
      },
    ],
  },
  he: {
    meta: {
      title: 'RoboQC | רובוט QC קוגניטיבי',
      description:
        'RoboQC הוא רובוט-מפקח איכות קוגניטיבי המבוסס על Romeo FlexVision. תופס שגיאות בתחנה 2 בזמן אמת, ולא רק בבדיקה 5.',
      ogTitle: 'RoboQC | powered by Romeo FlexVision',
      ogDescription: 'הרובוט-מצלמה שלא ישן לעולם. בקרת איכות inline ברמת התחנה.',
    },
    nav: {
      story: 'למה RoboQC',
      pains: '5 כאבים',
      comparison: 'השוואה',
      roadmap: 'מפת פריסה',
      contact: 'קשר',
      github: 'GitHub',
      telegram: 'Telegram',
      linkedin: 'LinkedIn',
      pilot: 'לפתוח צ׳אט פיילוט',
      menu: 'תפריט',
      close: 'סגור',
    },
    hero: {
      eyebrow: 'Powered by Romeo FlexVision',
      title: 'RoboQC. הרובוט-מצלמה שלך בכל תחנה.',
      subtitle: 'בקרת איכות inline. אנחנו תופסים 90% מהשגיאות בזמן אמת.',
      primaryCta: 'לפתוח צ׳אט פיילוט',
      secondaryCta: 'לראות את ההשוואה',
      badges: ['ניטור inline 24/7', 'לולאת תגובה מתחנה 2', 'הוכחה לפני הסלמה'],
      imageBadge: 'רובוט-מצלמה. לא ישן לעולם.',
      imageStat: 'התראה מתחנה 2 בתוך שניות',
      imageAlt: 'רובוט Romeo על קו ייצור',
    },
    sections: {
      story: 'רובוט QC לרגע שבו הפגם נולד',
      storyDescription:
        'RoboQC עובד על התחנה עצמה: מצלמה, הוכחה ולולאת הסלמה במשטח אחד שפונה למפעיל.',
      pains: '5 כאבים ש-RoboQC לוקח בלילה אחד',
      painsDescription:
        'המטרה פשוטה: להפסיק לשלם על פגמים שמתגלים מאוחר מדי, בלי פריים הוכחה ובלי מסירה נקייה לקו.',
      comparison: 'Romeo FlexVision vs LightGuide, Arkite, Drishti, Retrocausal',
      comparisonDescription:
        'RoboQC ממוצב סביב תפיסת פגם inline והוכחה למפעיל, לא רק סביב הדרכה, אנליטיקה או דיווח בדיעבד.',
      roadmap: 'מפת הפריסה',
      roadmapDescription:
        'מסלול מעשי מפיילוט בתחנה אחת לכיסוי inline של כמה תחנות בלי לתכנן מחדש את כל המפעל.',
      community: 'פיילוט, מאגרים ונקודות המגע הציבוריות',
      communityDescription:
        'Telegram נותן כניסה מהירה לפיילוט, GitHub מציג את הבילד הנוכחי, ו-LinkedIn מחזיק את המיצוב החיצוני.',
      faq: 'שאלות נפוצות',
      faqDescription: 'תשובות קצרות למפעילים, למהנדסים ולמממני פיילוט.',
    },
    labels: {
      poweredBy: 'Powered by Romeo FlexVision',
      comparisonColumns: ['RoboQC', 'LightGuide', 'Arkite', 'Drishti', 'Retrocausal'],
      footerSummary:
        'RoboQC הוא רובוט בקרת איכות קוגניטיבי שנבנה על גבי הסטאק של Romeo FlexVision.',
      footerNote:
        'הרובוט-מצלמה שתופס פגמים בתחנה 2 במקום לגלות אותם רק בבדיקה 5.',
      rights: '(c) 2026 RoboQC. כל הזכויות שמורות.',
    },
    ui: {
      liveLabel: 'RoboQC בזמן אמת',
      proofLabel: 'הוכחת inline',
      proofTitle: 'פריים, עקבה, החלטה',
      proofDescription:
        'תופסים את הפגם במקום שבו הוא נוצר, עם הוכחה שהקו יכול לפעול עליה מיד.',
      storyQuote: '"הרובוט-מצלמה שלא ישן לעולם."',
      capabilityLabel: 'יכולת',
      socialLabel: 'קישורים',
      brandGuideLabel: 'מדריך מותג',
      faqKicker: 'שאלות נפוצות',
    },
    metrics: [
      { label: 'מהשגיאות נתפסות בזמן אמת', value: 90, suffix: '%' },
      { label: 'כיסוי ניטור', value: 24, suffix: '/7' },
      { label: 'תחנת הפיילוט הראשית', value: 2, suffix: '' },
      { label: 'שניות עד התראת מפעיל', value: 8, suffix: 'ש׳' },
    ],
    storyCards: [
      {
        title: 'בדיקה שמתחילה במצלמה',
        description:
          'המערכת מביטה ישירות על התחנה, ולכן צוות האיכות מגיב בדיוק במקום שבו התהליך מתחיל לסטות.',
      },
      {
        title: 'קודם הוכחה',
        description:
          'כל התראה מגיעה עם פריים, הקשר ו-confidence, לא רק עם אות מופשט שקשה לפעול עליו.',
      },
      {
        title: 'בנוי לקו הייצור',
        description:
          'המוצר ממוסגר סביב פעולת המפעיל, לא סביב אנליטיקה יפה שמגיעה אחרי המשמרת.',
      },
    ],
    pains: [
      {
        title: 'הפגמים מתגלים מאוחר מדי',
        description: 'RoboQC מזיז את רגע הגילוי בחזרה לתחנה במקום לחכות לבדיקה מאוחרת.',
      },
      {
        title: 'אין פריים הוכחה',
        description: 'כל התראה יכולה להגיע עם הוכחה ויזואלית ולא רק עם שורה בגיליון.',
      },
      {
        title: 'בדיקה ידנית מתעייפת',
        description: 'הרובוט-מצלמה ממשיך להסתכל גם כשהקשב של המשמרת יורד.',
      },
      {
        title: 'הסלמה איטית',
        description: 'המפעיל מקבל אות שאפשר לפעול עליו בזמן שהחלק עדיין בתהליך.',
      },
      {
        title: 'עקבת שורש בעיה חלשה',
        description: 'ההתראות נשארות קשורות להקשר התחנה כדי שההנדסה תראה היסטוריית פגם אמיתית.',
      },
    ],
    comparisonRows: [
      {
        capability: 'תפיסת פגם inline על התחנה',
        values: [
          { label: 'תרחיש ליבה', tone: 'strong' },
          { label: 'ממוקד הדרכה', tone: 'weak' },
          { label: 'ממוקד הרכבה', tone: 'weak' },
          { label: 'ממוקד אנליטיקה', tone: 'mid' },
          { label: 'ממוקד אופטימיזציה', tone: 'weak' },
        ],
      },
      {
        capability: 'פריים הוכחה ו-traceability',
        values: [
          { label: 'מוכן למפעיל', tone: 'strong' },
          { label: 'חלקי', tone: 'mid' },
          { label: 'חלקי', tone: 'mid' },
          { label: 'קודם אנליטיקה', tone: 'mid' },
          { label: 'לא ליבה', tone: 'weak' },
        ],
      },
      {
        capability: 'פיילוט מהיר על תחנה אחת',
        values: [
          { label: 'Pilot-first', tone: 'strong' },
          { label: 'דורש תכנית הטמעה', tone: 'mid' },
          { label: 'דורש תכנון rollout', tone: 'mid' },
          { label: 'הקמת data כבדה', tone: 'weak' },
          { label: 'scope רחב', tone: 'weak' },
        ],
      },
      {
        capability: 'מצלמה ולולאת הסלמה במשטח אחד',
        values: [
          { label: 'מאוחד', tone: 'strong' },
          { label: 'ממוקד הוראות', tone: 'weak' },
          { label: 'ממוקד workflow', tone: 'mid' },
          { label: 'ממוקד dashboard', tone: 'weak' },
          { label: 'ממוקד מודל', tone: 'weak' },
        ],
      },
      {
        capability: 'לוגיקת תחנה 2 ולא בדיקה 5',
        values: [
          { label: 'ליבת המסר', tone: 'strong' },
          { label: 'לא ליבה', tone: 'weak' },
          { label: 'לא ליבה', tone: 'weak' },
          { label: 'לא ליבה', tone: 'weak' },
          { label: 'לא ליבה', tone: 'weak' },
        ],
      },
    ],
    roadmap: [
      {
        phase: 'עכשיו',
        title: 'פיילוט על תחנה אחת',
        description:
          'מחברים מצלמה אחת, משפחת פגמים אחת וערוץ מפעיל אחד כדי להוכיח ערך מהר.',
        status: 'מוכן לפיילוט',
        tone: 'success',
      },
      {
        phase: 'השלב הבא',
        title: 'חבילת הוכחה ולולאת דיווח',
        description:
          'מאחדים frame capture, confidence, trace והערות הסלמה לחבילה אחת שאפשר להפעיל על הקו.',
        status: 'בפריסה',
        tone: 'info',
      },
      {
        phase: 'השלב הבא',
        title: 'סקירת שורש בעיה לפי תחנה',
        description:
          'אוספים פגמים חוזרים לפי תחנה, משמרת ומשפחת חלקים כדי שההנדסה תראה את נקודת הכשל האמיתית.',
        status: 'אנליטיקה פעילה',
        tone: 'info',
      },
      {
        phase: 'אחר כך',
        title: 'אורקסטרציה של כמה תחנות',
        description:
          'מרחיבים את אותה לולאת evidence לכמה תחנות בלי להגדיל את כוח האדם לבדיקה ידנית.',
        status: 'שלב הרחבה',
        tone: 'warning',
      },
    ],
    communityCards: [
      {
        title: 'GitHub',
        description: 'המאגר, קוד המקור של הלנדינג והבילד הציבורי הנוכחי של RoboQC.',
        href: SITE_LINKS.github,
        action: 'פתח GitHub',
      },
      {
        title: 'Telegram Bot',
        description: 'נקודת הכניסה הציבורית המהירה ביותר לפיילוט, לדמו ולפניות נכנסות.',
        href: SITE_LINKS.telegram,
        action: 'פתח Telegram',
      },
      {
        title: 'LinkedIn',
        description: 'עדכוני מיצוב קצרים ונרטיב חיצוני סביב Romeo FlexVision.',
        href: SITE_LINKS.linkedin,
        action: 'פתח LinkedIn',
      },
    ],
    faq: [
      {
        question: 'מה זה RoboQC במשפט אחד?',
        answer:
          'RoboQC הוא רובוט-מפקח קוגניטיבי לבקרת איכות inline, שפועל על גבי vision stack של Romeo FlexVision.',
      },
      {
        question: 'מה כולל הפיילוט?',
        answer:
          'בדרך כלל מדובר בתחנה אחת, לולאת מצלמה אחת ומשפחת פגמים אחת כדי להוכיח ערך מהר ובלי מורכבות מיותרת.',
      },
      {
        question: 'למה מזכירים תחנה 2 ובדיקה 5?',
        answer:
          'כי המוצר ממוסגר סביב תפיסת הפגם במקום שבו הוא נוצר, לא במקום שבו הוא כבר יקר.',
      },
      {
        question: 'האם האתר פותח כרגע אפליקציית מוצר אמיתית?',
        answer:
          'עדיין לא. האתר הציבורי פושט כרגע ללנדינג תאגידי נקי שמוביל לשיחת פיילוט דרך Telegram.',
      },
    ],
  },
};

export function getSiteContent(language: Language): SiteCopy {
  return SITE_COPY[language] ?? SITE_COPY.en;
}
