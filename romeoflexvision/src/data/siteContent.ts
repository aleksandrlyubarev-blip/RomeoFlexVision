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

export interface SiteTechGroup {
  title: string;
  description: string;
  items: string[];
}

export interface SiteFlowStep {
  eyebrow: string;
  title: string;
  description: string;
  note: string;
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
  products: string;
  stack?: string;
  roadmap?: string;
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
  stack?: string;
  stackDescription?: string;
  flow?: string;
  flowDescription?: string;
  roadmap?: string;
  roadmapDescription?: string;
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
  techGroups?: SiteTechGroup[];
  flowSteps?: SiteFlowStep[];
  roadmap?: SiteRoadmapItem[];
  communityCards: SiteLinkCard[];
  faq: SiteFaqItem[];
}

interface SiteCopyExtras {
  nav: Required<Pick<SiteNavCopy, 'stack' | 'roadmap'>>;
  sections: Required<
    Pick<
      SiteSectionCopy,
      'stack' | 'stackDescription' | 'flow' | 'flowDescription' | 'roadmap' | 'roadmapDescription'
    >
  >;
  techGroups: SiteTechGroup[];
  flowSteps: SiteFlowStep[];
  roadmap: SiteRoadmapItem[];
}

export interface ResolvedSiteCopy extends Omit<SiteCopy, 'nav' | 'sections' | 'techGroups' | 'flowSteps' | 'roadmap'> {
  nav: SiteNavCopy & SiteCopyExtras['nav'];
  sections: SiteSectionCopy & SiteCopyExtras['sections'];
  techGroups: SiteTechGroup[];
  flowSteps: SiteFlowStep[];
  roadmap: SiteRoadmapItem[];
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
    stack: 'Tech Stack',
    roadmap: 'Roadmap',
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
    stack: 'Built for the station, not for slides',
    stackDescription:
      'RoboQC combines camera capture, Romeo FlexVision scoring, operator alerts, and reporting into one production-facing loop.',
    flow: 'How the evidence loop works',
    flowDescription:
      'From first frame to operator action, RoboQC keeps the defect context intact so the line can react immediately.',
    roadmap: 'Rollout roadmap',
    roadmapDescription:
      'A practical path from one-station pilot to multi-station inline quality coverage without redesigning the whole plant.',
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
  techGroups: [
    {
      title: 'Vision layer',
      description: 'Everything needed to detect defects where they are born on the line.',
      items: ['Industrial cameras', 'Romeo FlexVision', 'Confidence scoring', 'Station thresholds'],
    },
    {
      title: 'Operator control loop',
      description: 'The operator sees the same evidence package the model used to escalate.',
      items: ['Inline alerts', 'QC review', 'Human approval', 'Escalation rules'],
    },
    {
      title: 'Evidence and reporting',
      description: 'Each event stays traceable from the frame to the shift-level report.',
      items: ['Trace IDs', 'Evidence packs', 'Shift reports', 'Root-cause review'],
    },
    {
      title: 'Deployment surface',
      description: 'A compact stack that is realistic to pilot and easy to maintain.',
      items: ['FastAPI', 'LangGraph', 'Telegram bot', 'GitHub Actions'],
    },
  ],
  flowSteps: [
    {
      eyebrow: '01 Capture',
      title: 'The station camera flags the anomaly',
      description:
        'RoboQC watches the station continuously and isolates the frame where the process starts drifting.',
      note: 'Station #2 trigger in the live demo loop',
    },
    {
      eyebrow: '02 Score',
      title: 'Romeo FlexVision scores the defect',
      description:
        'The vision stack classifies the issue, attaches confidence, and checks whether the alert passes the station threshold.',
      note: 'Scoring and confidence stay tied to the same evidence package',
    },
    {
      eyebrow: '03 Package',
      title: 'Evidence, trace, and report are bundled together',
      description:
        'Instead of a naked alarm, the line receives a frame, a trace, and a human-readable explanation for fast review.',
      note: 'Frame + confidence + traceability in one operator packet',
    },
    {
      eyebrow: '04 Act',
      title: 'The operator decides while the part is still on the line',
      description:
        'RoboQC turns the model output into an actionable moment, not a delayed QA meeting after the shift has ended.',
      note: 'Designed to stop late discovery at test #5',
    },
  ],
  roadmap: [
    {
      phase: 'Now',
      title: 'Single-station pilot',
      description:
        'Connect one camera, one defect family, and one operator lane so the team can prove real-time catch rate fast.',
      status: 'Pilot ready',
      tone: 'success',
    },
    {
      phase: 'Next',
      title: 'Evidence pack and report loop',
      description:
        'Ship frame capture, confidence, trace, and escalation notes as one operator-facing report for every critical alert.',
      status: 'In rollout',
      tone: 'info',
    },
    {
      phase: 'Next',
      title: 'Root-cause feedback by station',
      description:
        'Trend repeated defects by station, shift, and part family so engineering can see where the process actually slips.',
      status: 'Analytics active',
      tone: 'info',
    },
    {
      phase: 'Later',
      title: 'Multi-station orchestration',
      description:
        'Coordinate alerts, approvals, and evidence flow across several stations without expanding manual inspection headcount.',
      status: 'Expansion path',
      tone: 'warning',
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
  meta: {
    title: 'RoboQC | רובוט QC קוגניטיבי',
    description:
      'RoboQC הוא רובוט-מפקח איכות קוגניטיבי המבוסס על Romeo FlexVision. תופס טעויות בתחנה 2, לא רק בבדיקה 5.',
    ogTitle: 'RoboQC | powered by Romeo FlexVision',
    ogDescription: 'הרובוט-מצלמה שלא ישן לעולם. בקרת איכות inline לפגמים ברמת התחנה.',
  },
  nav: {
    story: 'למה RoboQC',
    pains: '5 כאבים',
    comparison: 'השוואה',
    products: 'קו מוצרי RoboQC',
    contact: 'יצירת קשר',
    github: 'GitHub',
    telegram: 'Telegram',
    linkedin: 'LinkedIn',
    pilot: 'להפעיל פיילוט RoboQC',
    menu: 'תפריט',
    close: 'סגור',
  },
  hero: {
    eyebrow: 'Romeo FlexVision בפנים',
    title: 'RoboQC. הרובוט-מצלמה שלך בכל תחנה',
    subtitle: 'בקרת איכות inline. אנחנו תופסים 90% מהטעויות בזמן אמת',
    primaryCta: 'להפעיל פיילוט RoboQC',
    secondaryCta: 'לראות את ההשוואה',
    badges: ['ניטור קו 24/7', 'לולאת משוב בתחנה 2', 'הוכחה לפני הסלמה'],
    imageBadge: 'רובוט-מצלמה. לא ישן.',
    imageStat: 'התראה מתחנה 2 בתוך שניות',
    imageAlt: 'רובוט ROMEO על קו ייצור',
  },
  sections: {
    story: 'רובוט QC קוגניטיבי לרגע שבו הפגם נולד',
    storyDescription:
      'RoboQC ממוצב כקו התגובה הראשון על התחנה עצמה: מצלמה, עקבה ולולאת הסלמה במשטח אחד שמיועד למפעיל.',
    pains: '5 הכאבים ש-RoboQC לוקח בן לילה',
    painsDescription:
      'ההבטחה פשוטה: להפסיק לשלם על פגמים שמתגלים מאוחר מדי, על ידי אנשים עייפים, בלי פריים מוכיח ובלי מסירה מסודרת.',
    comparison: 'Romeo FlexVision vs LightGuide, Arkite, Drishti, Retrocausal',
    comparisonDescription:
      'המיצוב כאן מתמקד בלכידת פגמים inline ובחבילת הוכחה, לא רק בהדרכה, אנליטיקה או דיווח בדיעבד.',
    products: 'קו מוצרי RoboQC',
    productsDescription:
      'האתר שומר את מעטפת כלי ה-AI הרחבה, אבל ממסגר אותה כשכבת הפעלה פרקטית סביב רובוט הבדיקה.',
    community: 'פיילוט, מאגרים ונקודות מגע ציבוריות',
    communityDescription:
      'Telegram מתאים לפתיחת פיילוט מהירה, GitHub מציג את פני המוצר, ו-LinkedIn מחזיק את המיצוב כלפי חוץ.',
    faq: 'שאלות נפוצות',
    faqDescription: 'תשובות קצרות למפעילים, למנהלי הנדסה ולמי שמממן או מוביל את הפיילוט.',
  },
  labels: {
    poweredBy: 'Powered by Romeo FlexVision',
    openRepo: 'פתח מאגר',
    comparisonColumns: ['RoboQC', 'LightGuide', 'Arkite', 'Drishti', 'Retrocausal'],
    footerSummary: 'RoboQC הוא רובוט בקרת איכות קוגניטיבי שנבנה על גבי תשתית Romeo FlexVision.',
    footerNote: 'הרובוט-מצלמה שתופס פגמים בתחנה 2 במקום לגלות אותם רק בבדיקה 5.',
    rights: '(c) 2026 RoboQC. כל הזכויות שמורות.',
  },
  metrics: [
    { label: 'טעויות שנתפסות בזמן אמת', value: 90, suffix: '%' },
    { label: 'קצב כיסוי', value: 24, suffix: '/7' },
    { label: 'תחנת יעד', value: 2, suffix: '' },
    { label: 'השקת פיילוט בשבועות', value: 1, suffix: '+' },
  ],
  storyCards: [
    {
      title: 'Inline לפני סוף הקו',
      description: 'RoboQC נבנה לתחנה עצמה, לא רק לעמדות בדיקה סופיות או לדוחות QA מאוחרים.',
    },
    {
      title: 'ראיה חזותית, לא זיכרון מפעיל',
      description: 'כל התראה יכולה לשאת פריים, עקבה וסיבת הסלמה בזמן שהחלק עדיין בתנועה.',
    },
    {
      title: 'Romeo FlexVision מתחת למכסה המנוע',
      description: 'המותג החדש נשאר product-first, אבל שומר את Romeo FlexVision כמנוע הטכני בפנים.',
    },
  ],
  pains: [
    {
      title: 'פגמים מתגלים מאוחר מדי',
      description: 'RoboQC תופס את הבעיה בתחנה 2 במקום לגלות אותה רק בבדיקה 5.',
    },
    {
      title: 'בדיקות ידניות משתנות ממשמרת למשמרת',
      description: 'הרובוט-מצלמה לא מתעייף, לא ממהר ולא מתבלבל בגלל לחץ הקו.',
    },
    {
      title: 'אישורי שווא עוברים בלי הוכחה',
      description: 'כל התראה מגיעה עם פריים, עקבת ביטחון וסיבה חזותית ברורה לפעולה.',
    },
    {
      title: 'סיבת השורש נעלמת בין תחנות',
      description: 'לולאת הפיילוט קושרת את הפגם לתחנה המדויקת, לרגע המדויק ולפעולת המפעיל.',
    },
    {
      title: 'הנדסה שורפת זמן על ישיבות תיקון',
      description: 'RoboQC נותן לצוותי איכות הוכחה מיידית במקום סיפורי פגם מאוחרים.',
    },
  ],
  comparisonRows: [
    {
      capability: 'בדיקה חזותית inline על התחנה עצמה',
      values: [
        { label: 'כן', tone: 'strong' },
        { label: 'חלקית', tone: 'mid' },
        { label: 'חלקית', tone: 'mid' },
        { label: 'חלקית', tone: 'mid' },
        { label: 'לא', tone: 'weak' },
      ],
    },
    {
      capability: 'פוקוס על מניעת פגמים, לא רק על הנחיה',
      values: [
        { label: 'כן', tone: 'strong' },
        { label: 'לא', tone: 'weak' },
        { label: 'לא', tone: 'weak' },
        { label: 'חלקית', tone: 'mid' },
        { label: 'חלקית', tone: 'mid' },
      ],
    },
    {
      capability: 'פריים מוכיח ועקיבות לכל התראה',
      values: [
        { label: 'מובנה', tone: 'strong' },
        { label: 'חלקית', tone: 'mid' },
        { label: 'חלקית', tone: 'mid' },
        { label: 'כן', tone: 'strong' },
        { label: 'חלקית', tone: 'mid' },
      ],
    },
    {
      capability: 'פיילוט בלי לתכנן מחדש את כל הקו',
      values: [
        { label: 'מהיר', tone: 'strong' },
        { label: 'בינוני', tone: 'mid' },
        { label: 'בינוני', tone: 'mid' },
        { label: 'בינוני', tone: 'mid' },
        { label: 'איטי', tone: 'weak' },
      ],
    },
    {
      capability: 'סטאק הוויז׳ן של Romeo FlexVision כלול בפנים',
      values: [
        { label: 'מובנה', tone: 'strong' },
        { label: 'לא', tone: 'weak' },
        { label: 'לא', tone: 'weak' },
        { label: 'לא', tone: 'weak' },
        { label: 'לא', tone: 'weak' },
      ],
    },
  ],
  products: [
    {
      title: 'RoboQC Inspector',
      eyebrow: 'המותג הראשי',
      description: 'הרובוט-מצלמה ברמת התחנה שמביט בתהליך ברצף ומרים פגם לפני שהוא זולג לבדיקות downstream.',
      status: 'מוכן לפיילוט',
      statusTone: 'success',
      tags: ['בקרת inline', 'התראות ויז׳ן', 'עקיבות'],
      repoUrl: SITE_LINKS.products.roboqc,
    },
    {
      title: 'Romeo FlexVision Core',
      eyebrow: 'הטכנולוגיה בפנים',
      description: 'עמוד השדרה של הוויז׳ן שמפעיל את לוגיקת הזיהוי, הסקורינג, התנהגות המצלמה והוכחת המפעיל.',
      status: 'סטאק ליבה',
      statusTone: 'info',
      tags: ['סטאק ויז׳ן', 'סקורינג', 'לוגיקת מצלמה'],
      repoUrl: SITE_LINKS.products.roboqc,
    },
    {
      title: 'RoboQC Root Cause',
      eyebrow: 'אנליסט שורש הבעיה',
      description: 'מחבר בין פגמים, אירועי תחנה והקשר ייצור כדי שצוותי האיכות יזהו דפוסים חוזרים מהר יותר.',
      status: 'אנליטיקת תפעול',
      statusTone: 'warning',
      tags: ['אנליטיקה', 'סקירת מגמות', 'נתוני תחנה'],
      repoUrl: SITE_LINKS.products.andrew,
    },
    {
      title: 'RoboQC Reports',
      eyebrow: 'קופיילוט להסלמה',
      description: 'הופך את תוצרי הבדיקה לדוחות קריאים, סיכומי מפעיל וחבילת handoff טכנית לסקירות פיילוט.',
      status: 'שכבת דיווח',
      statusTone: 'info',
      tags: ['דוחות', 'handoff למפעיל', 'הערות פיילוט'],
      repoUrl: SITE_LINKS.products.romeo,
    },
    {
      title: 'RoboQC Academy',
      eyebrow: 'שכבת הדרכה',
      description: 'מייצר סרטוני הדרכה קצרים ומסבירנים כשצריך onboarding מהיר סביב פגמים חוזרים.',
      status: 'הטמעה',
      statusTone: 'info',
      tags: ['הדרכה', 'מדיה', 'קליטה'],
      repoUrl: SITE_LINKS.products.bassito,
    },
  ],
  communityCards: [
    {
      title: 'GitHub',
      description: 'המאגר, קוד המקור של הלנדינג ופני המוצר העדכניים למצגת RoboQC.',
      href: SITE_LINKS.github,
      action: 'פתח GitHub',
    },
    {
      title: 'Telegram Bot',
      description: 'נקודת הכניסה הציבורית המהירה ביותר לדמו, לפתיחת פיילוט ולפניות נכנסות.',
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
      answer: 'RoboQC הוא רובוט-מפקח קוגניטיבי לבקרת איכות inline, המופעל על גבי סטאק הוויז׳ן של Romeo FlexVision.',
    },
    {
      question: 'מה קורה בפיילוט?',
      answer: 'הפיילוט מתמקד בתחנה אחת, בלולאת מצלמה אחת ובמשפחת פגמים אחת כדי להוכיח ערך מהר.',
    },
    {
      question: 'למה מזכירים תחנה 2 ובדיקה 5?',
      answer: 'כי המוצר ממוסגר סביב תפיסת הפגם במקום שבו הוא נוצר, לא במקום שבו הוא כבר הופך ליקר.',
    },
    {
      question: 'האם כלי ה-AI האחרים עדיין קיימים?',
      answer: 'כן. האתר שומר את הכלים הסובבים וממסגר אותם כשכבות תמיכה סביב לולאת הבדיקה של RoboQC.',
    },
  ],
};

const EN_EXTRAS: SiteCopyExtras = {
  nav: {
    stack: EN_COPY.nav.stack ?? 'Tech Stack',
    roadmap: EN_COPY.nav.roadmap ?? 'Roadmap',
  },
  sections: {
    stack: EN_COPY.sections.stack ?? 'Built for the station, not for slides',
    stackDescription:
      EN_COPY.sections.stackDescription ??
      'RoboQC combines camera capture, Romeo FlexVision scoring, operator alerts, and reporting into one production-facing loop.',
    flow: EN_COPY.sections.flow ?? 'How the evidence loop works',
    flowDescription:
      EN_COPY.sections.flowDescription ??
      'From first frame to operator action, RoboQC keeps the defect context intact so the line can react immediately.',
    roadmap: EN_COPY.sections.roadmap ?? 'Rollout roadmap',
    roadmapDescription:
      EN_COPY.sections.roadmapDescription ??
      'A practical path from one-station pilot to multi-station inline quality coverage without redesigning the whole plant.',
  },
  techGroups: EN_COPY.techGroups ?? [],
  flowSteps: EN_COPY.flowSteps ?? [],
  roadmap: EN_COPY.roadmap ?? [],
};

const RU_EXTRAS: SiteCopyExtras = {
  nav: {
    stack: 'Техстек',
    roadmap: 'Роадмап',
  },
  sections: {
    stack: 'Техстек для реального цеха, а не для красивого слайда',
    stackDescription:
      'RoboQC соединяет камеру, scoring Romeo FlexVision, операторские алерты и отчётный контур в один production-ready цикл.',
    flow: 'Как работает контур доказательств',
    flowDescription:
      'От первого кадра до решения оператора RoboQC не теряет контекст дефекта, поэтому линия может реагировать сразу.',
    roadmap: 'Роадмап запуска',
    roadmapDescription:
      'Практический путь от пилота на одной станции к покрытию нескольких станций без перестройки всего производства.',
  },
  techGroups: [
    {
      title: 'Vision layer',
      description: 'Слой, который позволяет ловить дефект там, где он рождается на станции.',
      items: ['Промышленные камеры', 'Romeo FlexVision', 'Confidence scoring', 'Пороги станции'],
    },
    {
      title: 'Операторский контур',
      description: 'Оператор видит тот же пакет доказательств, по которому модель подняла алерт.',
      items: ['Inline alerts', 'QC review', 'Подтверждение человека', 'Правила эскалации'],
    },
    {
      title: 'Доказательства и отчёты',
      description: 'Каждое событие остаётся прослеживаемым от кадра до сменного отчёта.',
      items: ['Trace ID', 'Evidence packs', 'Сменные отчёты', 'Root-cause review'],
    },
    {
      title: 'Поверхность деплоя',
      description: 'Компактный стек, который реально поднять в пилоте и удерживать в эксплуатации.',
      items: ['FastAPI', 'LangGraph', 'Telegram bot', 'GitHub Actions'],
    },
  ],
  flowSteps: [
    {
      eyebrow: '01 Capture',
      title: 'Камера станции замечает аномалию',
      description:
        'RoboQC постоянно смотрит на процесс и выделяет тот кадр, в котором линия начинает уходить от нормы.',
      note: 'Триггер со станции №2 в живом контуре',
    },
    {
      eyebrow: '02 Score',
      title: 'Romeo FlexVision классифицирует дефект',
      description:
        'Vision-стек присваивает тип дефекта, confidence и проверяет, пересёк ли алерт рабочий порог станции.',
      note: 'Скоринг и confidence остаются привязанными к тому же evidence pack',
    },
    {
      eyebrow: '03 Package',
      title: 'Кадр, trace и отчёт собираются в один пакет',
      description:
        'Линия получает не голый alarm, а frame, trace и понятное объяснение, почему алерт нужно проверить сейчас.',
      note: 'Кадр + confidence + traceability в одном пакете для оператора',
    },
    {
      eyebrow: '04 Act',
      title: 'Оператор принимает решение, пока деталь ещё на линии',
      description:
        'RoboQC превращает вывод модели в действие здесь и сейчас, а не в позднее обсуждение качества после смены.',
      note: 'Именно так мы уводим поиск дефекта с теста №5 на станцию №2',
    },
  ],
  roadmap: [
    {
      phase: 'Сейчас',
      title: 'Пилот на одной станции',
      description:
        'Подключаем одну камеру, один класс дефекта и один операторский контур, чтобы быстро доказать real-time catch rate.',
      status: 'Готово к пилоту',
      tone: 'success',
    },
    {
      phase: 'Следом',
      title: 'Evidence pack и отчётный цикл',
      description:
        'Закрываем frame capture, confidence, trace и escalation notes в единый отчётный пакет для каждого критичного алерта.',
      status: 'Идёт развёртывание',
      tone: 'info',
    },
    {
      phase: 'Следом',
      title: 'Root-cause аналитика по станциям',
      description:
        'Собираем повторяемые дефекты по станциям, сменам и семействам деталей, чтобы инженерия видела реальную точку срыва.',
      status: 'Активная аналитика',
      tone: 'info',
    },
    {
      phase: 'Дальше',
      title: 'Оркестрация нескольких станций',
      description:
        'Сводим алерты, подтверждения и evidence flow по нескольким станциям без наращивания ручного инспекционного контура.',
      status: 'Следующий этап',
      tone: 'warning',
    },
  ],
};

const HE_EXTRAS: SiteCopyExtras = {
  nav: {
    stack: 'סטאק טכנולוגי',
    roadmap: 'מפת פריסה',
  },
  sections: {
    stack: 'בנוי לתחנה, לא למצגת',
    stackDescription:
      'RoboQC מחבר לכידת מצלמה, scoring של Romeo FlexVision, התראות מפעיל ודיווח ללולאה אחת שפונה לייצור.',
    flow: 'איך לולאת ההוכחה עובדת',
    flowDescription:
      'מהפריים הראשון ועד לפעולת המפעיל, RoboQC שומר את הקונטקסט של הפגם שלם כדי שהקו יוכל להגיב מיד.',
    roadmap: 'מפת הפריסה',
    roadmapDescription:
      'מסלול מעשי מפיילוט בתחנה אחת לכיסוי inline של כמה תחנות בלי לתכנן מחדש את כל המפעל.',
  },
  techGroups: [
    {
      title: 'שכבת ויז׳ן',
      description: 'כל מה שצריך כדי לתפוס פגמים במקום שבו הם נולדים על הקו.',
      items: ['מצלמות תעשייתיות', 'Romeo FlexVision', 'Confidence scoring', 'ספי תחנה'],
    },
    {
      title: 'לולאת שליטה למפעיל',
      description: 'המפעיל רואה את אותה חבילת הוכחה שעל פיה המודל החליט להסלים.',
      items: ['התראות inline', 'סקירת QC', 'אישור אנושי', 'כללי הסלמה'],
    },
    {
      title: 'הוכחה ודיווח',
      description: 'כל אירוע נשאר עקיב מהפריים ועד לדוח המשמרת.',
      items: ['Trace IDs', 'Evidence packs', 'דוחות משמרת', 'סקירת שורש הבעיה'],
    },
    {
      title: 'מעטפת הפריסה',
      description: 'סטאק קומפקטי שאפשר באמת להרים בפיילוט ולתחזק לאורך זמן.',
      items: ['FastAPI', 'LangGraph', 'Telegram bot', 'GitHub Actions'],
    },
  ],
  flowSteps: [
    {
      eyebrow: '01 לכידה',
      title: 'מצלמת התחנה מסמנת את האנומליה',
      description:
        'RoboQC מביט ברצף על התחנה ומבודד את הפריים שבו התהליך מתחיל לסטות מהנורמה.',
      note: 'טריגר מתחנה 2 בלולאת הדמו החיה',
    },
    {
      eyebrow: '02 ניקוד',
      title: 'Romeo FlexVision מדרג את הפגם',
      description:
        'סטאק הוויז׳ן מסווג את הבעיה, מצמיד confidence ובודק האם ההתראה חוצה את סף התחנה.',
      note: 'הסקורינג וה-confidence נשארים קשורים לאותה חבילת הוכחה',
    },
    {
      eyebrow: '03 חבילה',
      title: 'פריים, עקבה ודוח נארזים יחד',
      description:
        'במקום אזעקה ערומה, הקו מקבל פריים, עקבה והסבר קריא שמבהיר למה צריך לבדוק את ההתראה עכשיו.',
      note: 'פריים + confidence + traceability בחבילה אחת למפעיל',
    },
    {
      eyebrow: '04 פעולה',
      title: 'המפעיל מחליט כשהחלק עדיין על הקו',
      description:
        'RoboQC הופך את פלט המודל לרגע פעולה כאן ועכשיו, לא לדיון QA מאוחר אחרי סיום המשמרת.',
      note: 'כך מעבירים את גילוי הפגם מבדיקה 5 בחזרה לתחנה 2',
    },
  ],
  roadmap: [
    {
      phase: 'עכשיו',
      title: 'פיילוט בתחנה אחת',
      description:
        'מחברים מצלמה אחת, משפחת פגמים אחת וערוץ מפעיל אחד כדי להוכיח מהר את שיעור התפיסה בזמן אמת.',
      status: 'מוכן לפיילוט',
      tone: 'success',
    },
    {
      phase: 'השלב הבא',
      title: 'חבילת הוכחה ולולאת דיווח',
      description:
        'מעלים frame capture, confidence, trace והערות הסלמה כחבילת דיווח אחת שפונה למפעיל בכל התראה קריטית.',
      status: 'בפריסה',
      tone: 'info',
    },
    {
      phase: 'השלב הבא',
      title: 'משוב שורש הבעיה לפי תחנה',
      description:
        'ממפים פגמים חוזרים לפי תחנה, משמרת ומשפחת חלקים כדי שההנדסה תראה איפה התהליך באמת מחליק.',
      status: 'אנליטיקה פעילה',
      tone: 'info',
    },
    {
      phase: 'אחר כך',
      title: 'אורקסטרציה של כמה תחנות',
      description:
        'מתאמים התראות, אישורים וזרימת evidence בין כמה תחנות בלי להגדיל את כוח האדם לבדיקה ידנית.',
      status: 'שלב הרחבה',
      tone: 'warning',
    },
  ],
};

export function getSiteContent(language: Language): ResolvedSiteCopy {
  const baseCopy = language === 'ru' ? RU_COPY : language === 'he' ? HE_COPY : EN_COPY;
  const extras = language === 'ru' ? RU_EXTRAS : language === 'he' ? HE_EXTRAS : EN_EXTRAS;

  return {
    ...baseCopy,
    nav: {
      ...baseCopy.nav,
      ...extras.nav,
    },
    sections: {
      ...baseCopy.sections,
      ...extras.sections,
    },
    techGroups: extras.techGroups,
    flowSteps: extras.flowSteps,
    roadmap: extras.roadmap,
  };
}
