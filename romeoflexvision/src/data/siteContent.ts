import type { Language } from '../context/LanguageContext';

export const SITE_LINKS = {
  github: 'https://github.com/aleksandrlyubarev-blip/RomeoFlexVision',
  telegram: 'https://t.me/RomeoFlexVision_bot',
  telegramHandle: '@RomeoFlexVision_bot',
  linkedin: 'https://www.linkedin.com/company/romeoflexvision',
  landing: 'https://romeoflexvision.com/',
  products: {
    roboqc: 'https://github.com/aleksandrlyubarev-blip/RomeoFlexVision',
    andrew: 'https://github.com/aleksandrlyubarev-blip/Andrew-Analitic',
    romeo: 'https://github.com/aleksandrlyubarev-blip/Romeo_PHD',
    bassito: 'https://github.com/aleksandrlyubarev-blip/Bassito',
  },
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

export interface SiteProduct {
  title: string;
  eyebrow: string;
  description: string;
  status: string;
  statusTone: 'success' | 'warning' | 'info';
  tags: string[];
  repoUrl: string;
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
  products: string;
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
  products: string;
  productsDescription: string;
  community: string;
  communityDescription: string;
  faq: string;
  faqDescription: string;
}

interface SiteLabelCopy {
  poweredBy: string;
  openRepo: string;
  comparisonColumns: string[];
  footerSummary: string;
  footerNote: string;
  rights: string;
}

export interface SiteCopy {
  meta: SiteMetaCopy;
  nav: SiteNavCopy;
  hero: SiteHeroCopy;
  sections: SiteSectionCopy;
  labels: SiteLabelCopy;
  metrics: SiteMetric[];
  storyCards: SiteStoryCard[];
  pains: SitePain[];
  comparisonRows: SiteComparisonRow[];
  products: SiteProduct[];
  communityCards: SiteLinkCard[];
  faq: SiteFaqItem[];
}

const EN_COPY: SiteCopy = {
  meta: {
    title: 'RoboQC | Cognitive Quality Inspector',
    description:
      'RoboQC is the cognitive robot-inspector powered by Romeo FlexVision. Catch station-2 defects in real time, not at test #5.',
    ogTitle: 'RoboQC | Powered by Romeo FlexVision',
    ogDescription: 'The robot-camera that never sleeps. Inline quality control for station-level defects.',
  },
  nav: {
    story: 'Why RoboQC',
    pains: '5 Pain Points',
    comparison: 'Comparison',
    products: 'RoboQC Line',
    contact: 'Contact',
    github: 'GitHub',
    telegram: 'Telegram',
    linkedin: 'LinkedIn',
    pilot: 'Launch RoboQC pilot',
    menu: 'Menu',
    close: 'Close',
  },
  hero: {
    eyebrow: 'Romeo FlexVision inside',
    title: 'RoboQC. Your camera-robot on every station.',
    subtitle: 'Inline quality control. We catch 90% of errors in real time.',
    primaryCta: 'Launch RoboQC pilot',
    secondaryCta: 'See the comparison',
    badges: ['24/7 line monitoring', 'Station #2 feedback loop', 'Evidence before escalation'],
    imageBadge: 'Robot camera. Never sleeps.',
    imageStat: 'Station #2 alert in seconds',
    imageAlt: 'ROMEO robot on a production line',
  },
  sections: {
    story: 'A cognitive QC robot for the moment defects are born',
    storyDescription:
      'RoboQC is positioned as the first responder on the station itself: camera, trace, and escalation loop in one operator-facing surface.',
    pains: '5 pains RoboQC removes overnight',
    painsDescription:
      'The promise is simple: stop paying for defects discovered too late, by tired people, without proof frames or clean handoff.',
    comparison: 'Romeo FlexVision vs LightGuide, Arkite, Drishti, Retrocausal',
    comparisonDescription:
      'This positioning focuses on inline defect capture and evidence, not just guidance, analytics, or after-the-fact reporting.',
    products: 'The RoboQC line',
    productsDescription:
      'The landing keeps the broader AI toolset, but reframes it as one practical RoboQC operating layer around the inspection robot.',
    community: 'Pilot launch, repositories, and public touchpoints',
    communityDescription:
      'Use Telegram for a fast pilot intro, GitHub for the build surface, and LinkedIn for positioning updates.',
    faq: 'FAQ',
    faqDescription: 'Fast answers for operators, engineering managers, and pilot sponsors.',
  },
  labels: {
    poweredBy: 'Powered by Romeo FlexVision',
    openRepo: 'Open repository',
    comparisonColumns: ['RoboQC', 'LightGuide', 'Arkite', 'Drishti', 'Retrocausal'],
    footerSummary:
      'RoboQC is a cognitive quality-control robot built on top of the Romeo FlexVision stack.',
    footerNote: 'The robot-camera that catches defects on station #2 instead of discovering them at test #5.',
    rights: '(c) 2026 RoboQC. All rights reserved.',
  },
  metrics: [
    { label: 'Errors caught in real time', value: 90, suffix: '%' },
    { label: 'Coverage rhythm', value: 24, suffix: '/7' },
    { label: 'Target station', value: 2, suffix: '' },
    { label: 'Pilot launch in weeks', value: 1, suffix: '+' },
  ],
  storyCards: [
    {
      title: 'Inline before end-of-line',
      description:
        'RoboQC is designed for the station, not only for final test benches and delayed QA reporting.',
    },
    {
      title: 'Visual evidence, not operator memory',
      description:
        'Every alert can carry a frame, a trace, and a reason to escalate while the part is still in motion.',
    },
    {
      title: 'Romeo FlexVision under the hood',
      description:
        'The new brand stays product-first while keeping the Romeo FlexVision stack as the technical engine inside.',
    },
  ],
  pains: [
    {
      title: 'Defects are found too late',
      description: 'RoboQC catches the issue on station #2 instead of discovering it on test #5.',
    },
    {
      title: 'Manual checks drift by shift',
      description: 'The robot-camera never gets tired, rushed, or distracted by line pressure.',
    },
    {
      title: 'False OKs pass without proof',
      description: 'Each alert can be backed by a frame, a confidence trail, and a concrete visual reason.',
    },
    {
      title: 'Root cause disappears between stations',
      description: 'The pilot loop keeps the defect trace tied to the exact station, moment, and operator action.',
    },
    {
      title: 'Engineering loses time on rework meetings',
      description: 'RoboQC gives quality teams immediate evidence instead of late-stage defect storytelling.',
    },
  ],
  comparisonRows: [
    {
      capability: 'Inline visual inspection on the station',
      values: [
        { label: 'Yes', tone: 'strong' },
        { label: 'Partial', tone: 'mid' },
        { label: 'Partial', tone: 'mid' },
        { label: 'Partial', tone: 'mid' },
        { label: 'No', tone: 'weak' },
      ],
    },
    {
      capability: 'Focus on defect prevention, not only guidance',
      values: [
        { label: 'Yes', tone: 'strong' },
        { label: 'No', tone: 'weak' },
        { label: 'No', tone: 'weak' },
        { label: 'Partial', tone: 'mid' },
        { label: 'Partial', tone: 'mid' },
      ],
    },
    {
      capability: 'Proof frame and traceability for each alert',
      values: [
        { label: 'Built in', tone: 'strong' },
        { label: 'Partial', tone: 'mid' },
        { label: 'Partial', tone: 'mid' },
        { label: 'Yes', tone: 'strong' },
        { label: 'Partial', tone: 'mid' },
      ],
    },
    {
      capability: 'Pilot without redesigning the whole line',
      values: [
        { label: 'Fast', tone: 'strong' },
        { label: 'Medium', tone: 'mid' },
        { label: 'Medium', tone: 'mid' },
        { label: 'Medium', tone: 'mid' },
        { label: 'Slow', tone: 'weak' },
      ],
    },
    {
      capability: 'Romeo FlexVision vision stack included',
      values: [
        { label: 'Native', tone: 'strong' },
        { label: 'No', tone: 'weak' },
        { label: 'No', tone: 'weak' },
        { label: 'No', tone: 'weak' },
        { label: 'No', tone: 'weak' },
      ],
    },
  ],
  products: [
    {
      title: 'RoboQC Inspector',
      eyebrow: 'Primary brand',
      description:
        'The station-level robot-camera that watches the process continuously and flags the defect before downstream test.',
      status: 'Pilot ready',
      statusTone: 'success',
      tags: ['Inline QC', 'Vision alerts', 'Traceability'],
      repoUrl: SITE_LINKS.products.roboqc,
    },
    {
      title: 'Romeo FlexVision Core',
      eyebrow: 'Technology inside',
      description:
        'The machine-vision backbone powering detection logic, scoring, camera behavior, and operator-proof evidence.',
      status: 'Core stack',
      statusTone: 'info',
      tags: ['Vision stack', 'Scoring', 'Camera logic'],
      repoUrl: SITE_LINKS.products.roboqc,
    },
    {
      title: 'RoboQC Root Cause',
      eyebrow: 'Root-cause analyst',
      description:
        'Connects defects, station events, and production context so quality engineers can spot repeat patterns faster.',
      status: 'Ops analytics',
      statusTone: 'warning',
      tags: ['Analytics', 'Trend review', 'Station data'],
      repoUrl: SITE_LINKS.products.andrew,
    },
    {
      title: 'RoboQC Reports',
      eyebrow: 'Escalation copilot',
      description:
        'Turns inspection output into readable reports, operator summaries, and technical handoff for pilot reviews.',
      status: 'Reporting layer',
      statusTone: 'info',
      tags: ['Reports', 'Operator handoff', 'Pilot notes'],
      repoUrl: SITE_LINKS.products.romeo,
    },
    {
      title: 'RoboQC Academy',
      eyebrow: 'Training media layer',
      description:
        'Builds quick training clips and explainers when the pilot needs operator onboarding around repeated defects.',
      status: 'Enablement',
      statusTone: 'info',
      tags: ['Training', 'Media', 'Onboarding'],
      repoUrl: SITE_LINKS.products.bassito,
    },
  ],
  communityCards: [
    {
      title: 'GitHub',
      description: 'Repository, landing source, and the current product surface for the RoboQC pitch.',
      href: SITE_LINKS.github,
      action: 'Open GitHub',
    },
    {
      title: 'Telegram Bot',
      description: 'Fastest public entry point for demo routing, pilot intros, and inbound requests.',
      href: SITE_LINKS.telegram,
      action: 'Open Telegram',
    },
    {
      title: 'LinkedIn',
      description: 'Short-form positioning updates and investor-facing narrative around Romeo FlexVision.',
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
        'The pilot focuses on one station, one camera loop, and one defect class so the team can prove value quickly.',
    },
    {
      question: 'Why mention station #2 and test #5?',
      answer:
        'Because the product is framed around catching the defect where it is created, not where it becomes expensive.',
    },
    {
      question: 'Do the other AI products still exist?',
      answer:
        'Yes. The landing keeps the surrounding tools and reframes them as supporting layers around the RoboQC inspection loop.',
    },
  ],
};

const RU_COPY: SiteCopy = {
  meta: {
    title: 'RoboQC | Когнитивный QC-робот',
    description:
      'RoboQC — когнитивный робот-инспектор качества на базе Romeo FlexVision. Ловит ошибки на станции №2, а не на тесте №5.',
    ogTitle: 'RoboQC | powered by Romeo FlexVision',
    ogDescription:
      'Робот-камера, которая никогда не спит. Inline контроль качества для дефектов прямо на станции.',
  },
  nav: {
    story: 'Почему RoboQC',
    pains: '5 болей',
    comparison: 'Сравнение',
    products: 'Вся линейка RoboQC',
    contact: 'Контакты',
    github: 'GitHub',
    telegram: 'Telegram',
    linkedin: 'LinkedIn',
    pilot: 'Запустить RoboQC-пилот',
    menu: 'Меню',
    close: 'Закрыть',
  },
  hero: {
    eyebrow: 'Romeo FlexVision внутри',
    title: 'RoboQC. Твой робот-камера на каждой станции',
    subtitle: 'Inline контроль качества. 90 % ошибок ловим в реальном времени',
    primaryCta: 'Запустить RoboQC-пилот',
    secondaryCta: 'Сравнить с рынком',
    badges: ['24/7 контроль линии', 'Замыкаем цикл на станции №2', 'Каждый алерт с доказательством'],
    imageBadge: 'Робот-камера. Никогда не спит.',
    imageStat: 'Алерт со станции №2 за секунды',
    imageAlt: 'Робот ROMEO на производственной линии',
  },
  sections: {
    story: 'Когнитивный QC-робот для момента, когда брак только появляется',
    storyDescription:
      'RoboQC позиционируется как первый ответ прямо на станции: камера, след дефекта и цикл эскалации в одном операторском продукте.',
    pains: '5 болей, которые RoboQC забирает за одну ночь',
    painsDescription:
      'Главное обещание простое: перестать платить за дефекты, найденные слишком поздно, уставшими людьми и без нормального доказательства.',
    comparison: 'Romeo FlexVision vs LightGuide, Arkite, Drishti, Retrocausal',
    comparisonDescription:
      'Этот блок показывает позиционинг вокруг inline-ловли дефекта и доказательной картинки, а не только инструкций, аналитики или отчёта постфактум.',
    products: 'Вся линейка RoboQC',
    productsDescription:
      'Сохраняем существующие AI-продукты, но собираем их вокруг одной практической логики: робот-инспектор, аналитика, отчёт и обучение оператора.',
    community: 'Пилот, репозитории и публичные точки входа',
    communityDescription:
      'Telegram нужен для быстрого старта пилота, GitHub показывает продуктовую поверхность, LinkedIn держит внешний narrative.',
    faq: 'FAQ',
    faqDescription: 'Короткие ответы для производства, качества и тех, кто принимает решение о пилоте.',
  },
  labels: {
    poweredBy: 'Powered by Romeo FlexVision',
    openRepo: 'Открыть репозиторий',
    comparisonColumns: ['RoboQC', 'LightGuide', 'Arkite', 'Drishti', 'Retrocausal'],
    footerSummary:
      'RoboQC — когнитивный робот-инспектор качества, собранный поверх технологического стека Romeo FlexVision.',
    footerNote: 'Робот-камера, которая ловит дефект на станции №2, а не узнаёт о нём только на тесте №5.',
    rights: '(c) 2026 RoboQC. Все права защищены.',
  },
  metrics: [
    { label: 'Ошибок ловим в реальном времени', value: 90, suffix: '%' },
    { label: 'Режим наблюдения', value: 24, suffix: '/7' },
    { label: 'Ключевая станция', value: 2, suffix: '' },
    { label: 'Старт пилота за недели', value: 1, suffix: '+' },
  ],
  storyCards: [
    {
      title: 'Inline, а не только финальный тест',
      description:
        'RoboQC ставится туда, где дефект рождается, а не туда, где о нём слишком поздно узнают.',
    },
    {
      title: 'Не память оператора, а визуальное доказательство',
      description:
        'Каждый алерт можно показать кадром, уверенностью модели и понятной причиной эскалации.',
    },
    {
      title: 'Romeo FlexVision остаётся внутри',
      description:
        'Новый бренд выводим на первый план, а Romeo FlexVision сохраняем как технологию внутри продукта.',
    },
  ],
  pains: [
    {
      title: 'Дефект находят слишком поздно',
      description: 'RoboQC ловит проблему на станции №2, а не узнаёт о ней только на тесте №5.',
    },
    {
      title: 'Ручной контроль плывёт от смены к смене',
      description: 'Робот-камера не устает, не спешит и не пропускает из-за давления линии.',
    },
    {
      title: 'Пропуски уходят дальше без доказательства',
      description: 'У каждого алерта есть кадр, след, уверенность и понятная причина для действия.',
    },
    {
      title: 'Корневая причина теряется между станциями',
      description: 'Пилот привязывает дефект к конкретной станции, моменту и операторскому контексту.',
    },
    {
      title: 'Инженеры тратят время на пересказы вместо исправления',
      description: 'RoboQC даёт качеству и производству доказательства сразу, а не на разборе постфактум.',
    },
  ],
  comparisonRows: [
    {
      capability: 'Inline визуальная инспекция прямо на станции',
      values: [
        { label: 'Да', tone: 'strong' },
        { label: 'Частично', tone: 'mid' },
        { label: 'Частично', tone: 'mid' },
        { label: 'Частично', tone: 'mid' },
        { label: 'Нет', tone: 'weak' },
      ],
    },
    {
      capability: 'Фокус на предотвращении дефекта, а не только на инструкциях',
      values: [
        { label: 'Да', tone: 'strong' },
        { label: 'Нет', tone: 'weak' },
        { label: 'Нет', tone: 'weak' },
        { label: 'Частично', tone: 'mid' },
        { label: 'Частично', tone: 'mid' },
      ],
    },
    {
      capability: 'Кадр-доказательство и trace для каждого алерта',
      values: [
        { label: 'Встроено', tone: 'strong' },
        { label: 'Частично', tone: 'mid' },
        { label: 'Частично', tone: 'mid' },
        { label: 'Да', tone: 'strong' },
        { label: 'Частично', tone: 'mid' },
      ],
    },
    {
      capability: 'Быстрый пилот без перестройки всей линии',
      values: [
        { label: 'Быстро', tone: 'strong' },
        { label: 'Средне', tone: 'mid' },
        { label: 'Средне', tone: 'mid' },
        { label: 'Средне', tone: 'mid' },
        { label: 'Медленно', tone: 'weak' },
      ],
    },
    {
      capability: 'Romeo FlexVision как нативный vision stack внутри',
      values: [
        { label: 'Нативно', tone: 'strong' },
        { label: 'Нет', tone: 'weak' },
        { label: 'Нет', tone: 'weak' },
        { label: 'Нет', tone: 'weak' },
        { label: 'Нет', tone: 'weak' },
      ],
    },
  ],
  products: [
    {
      title: 'RoboQC Inspector',
      eyebrow: 'Главный бренд',
      description:
        'Робот-камера на станции, который следит за процессом непрерывно и поднимает дефект до того, как он уйдёт дальше по линии.',
      status: 'Готов к пилоту',
      statusTone: 'success',
      tags: ['Inline QC', 'Vision alerts', 'Traceability'],
      repoUrl: SITE_LINKS.products.roboqc,
    },
    {
      title: 'Romeo FlexVision Core',
      eyebrow: 'Технология внутри',
      description:
        'Vision-ядро, которое питает детекцию, скоринг, поведение камеры и доказательную картинку для оператора.',
      status: 'Core stack',
      statusTone: 'info',
      tags: ['Vision stack', 'Scoring', 'Camera logic'],
      repoUrl: SITE_LINKS.products.roboqc,
    },
    {
      title: 'RoboQC Root Cause',
      eyebrow: 'Аналитика причин',
      description:
        'Связывает дефекты, события станции и производственный контекст, чтобы быстрее находить повторяющиеся паттерны.',
      status: 'Ops analytics',
      statusTone: 'warning',
      tags: ['Analytics', 'Trend review', 'Station data'],
      repoUrl: SITE_LINKS.products.andrew,
    },
    {
      title: 'RoboQC Reports',
      eyebrow: 'Копилот отчёта',
      description:
        'Превращает инспекцию в читаемый отчёт, summary для оператора и техничную передачу результата в пилотном цикле.',
      status: 'Reporting layer',
      statusTone: 'info',
      tags: ['Reports', 'Operator handoff', 'Pilot notes'],
      repoUrl: SITE_LINKS.products.romeo,
    },
    {
      title: 'RoboQC Academy',
      eyebrow: 'Обучающий слой',
      description:
        'Помогает быстро собрать обучающие ролики и объясняющие материалы, если пилот упирается в повторяющиеся ошибки оператора.',
      status: 'Enablement',
      statusTone: 'info',
      tags: ['Training', 'Media', 'Onboarding'],
      repoUrl: SITE_LINKS.products.bassito,
    },
  ],
  communityCards: [
    {
      title: 'GitHub',
      description: 'Репозиторий, исходники лендинга и текущая продуктовая поверхность для презентации RoboQC.',
      href: SITE_LINKS.github,
      action: 'Открыть GitHub',
    },
    {
      title: 'Telegram Bot',
      description: 'Самая быстрая публичная точка входа для демо, пилота и входящих запросов.',
      href: SITE_LINKS.telegram,
      action: 'Открыть Telegram',
    },
    {
      title: 'LinkedIn',
      description: 'Короткие позиционные апдейты и внешний narrative вокруг Romeo FlexVision.',
      href: SITE_LINKS.linkedin,
      action: 'Открыть LinkedIn',
    },
  ],
  faq: [
    {
      question: 'Что такое RoboQC в одном предложении?',
      answer:
        'RoboQC — когнитивный робот-инспектор качества для inline-контроля, работающий на технологическом стеке Romeo FlexVision.',
    },
    {
      question: 'Что входит в пилот?',
      answer:
        'Обычно это одна станция, один класс дефекта и один контур эскалации, чтобы быстро доказать ценность без лишней сложности.',
    },
    {
      question: 'Почему акцент на станции №2 и тесте №5?',
      answer:
        'Потому что весь narrative построен вокруг идеи ловить дефект там, где он рождается, а не там, где он уже дорогой.',
    },
    {
      question: 'Другие AI-продукты остаются?',
      answer:
        'Да. Мы сохраняем окружающие продукты и показываем их как поддерживающие слои вокруг инспекционного цикла RoboQC.',
    },
  ],
};

const HE_COPY: SiteCopy = {
  ...EN_COPY,
  nav: {
    ...EN_COPY.nav,
    products: 'RoboQC Line',
  },
};

export function getSiteContent(language: Language): SiteCopy {
  if (language === 'ru') {
    return RU_COPY;
  }

  if (language === 'he') {
    return HE_COPY;
  }

  return EN_COPY;
}
