import type { Language } from '../context/LanguageContext';

export const SITE_LINKS = {
  github: 'https://github.com/aleksandrlyubarev-blip',
  telegram: 'https://t.me/RomeoFlexVision_bot',
  telegramHandle: '@RomeoFlexVision_bot',
  linkedin: 'https://www.linkedin.com/company/romeoflexvision',
  products: {
    andrew: 'https://github.com/aleksandrlyubarev-blip/Andrew-Analitic',
    romeo: 'https://github.com/aleksandrlyubarev-blip/Romeo_PHD',
    bassito: 'https://github.com/aleksandrlyubarev-blip/Bassito',
    pinocut: 'https://github.com/aleksandrlyubarev-blip/Pino_cut',
  },
} as const;

export interface SiteMetric {
  label: string;
  value: number;
  suffix: string;
}

export interface SiteProduct {
  id: string;
  title: string;
  eyebrow: string;
  description: string;
  status: string;
  statusTone: 'success' | 'warning' | 'info';
  tags: string[];
  repoUrl: string;
}

export interface SiteTechGroup {
  title: string;
  items: string[];
}

export interface SiteRoadmapItem {
  phase: string;
  title: string;
  description: string;
  status: string;
  statusTone: 'success' | 'warning' | 'muted';
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

export interface SitePainPoint {
  icon: string;
  title: string;
  description: string;
}

export interface SiteCompetitor {
  name: string;
  inline: boolean;
  ai: boolean;
  multiStation: boolean;
  ru: boolean;
  fastPilot: boolean;
  isUs: boolean;
}

interface SiteMetaCopy {
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
}

interface SiteNavCopy {
  ecosystem: string;
  products: string;
  stack: string;
  roadmap: string;
  contact: string;
  github: string;
  telegram: string;
  linkedin: string;
  openPlatform: string;
  signIn: string;
  signOut: string;
  menu: string;
  close: string;
  openRepo: string;
  quickLinks: string;
  social: string;
}

interface SiteHeroCopy {
  eyebrow: string;
  title: string;
  subtitle: string;
  primaryCta: string;
  secondaryCta: string;
  tertiaryCta: string;
  orbitTitle: string;
  orbitCaption: string;
}

interface SitePainSectionCopy {
  kicker: string;
  title: string;
  description: string;
}

interface SiteCompetitorsSectionCopy {
  kicker: string;
  title: string;
  description: string;
  featureInline: string;
  featureAi: string;
  featureMulti: string;
  featureRu: string;
  featurePilot: string;
}

interface SiteSectionCopy {
  ecosystem: string;
  ecosystemDescription: string;
  products: string;
  productsDescription: string;
  stack: string;
  stackDescription: string;
  architecture: string;
  architectureDescription: string;
  roadmap: string;
  roadmapDescription: string;
  investors: string;
  investorsDescription: string;
  community: string;
  communityDescription: string;
  faq: string;
  faqDescription: string;
}

interface SiteLabelCopy {
  centralNode: string;
  sharedControlPlane: string;
  sharedControlPlaneDescription: string;
  crossDomainExecution: string;
  crossDomainExecutionDescription: string;
  humanLoop: string;
  humanLoopDescription: string;
  builtWith: string;
  footerSummary: string;
  footerStack: string;
  rights: string;
  investorCta: string;
  roadmapStep: string;
}

interface SiteCopy {
  meta: SiteMetaCopy;
  nav: SiteNavCopy;
  hero: SiteHeroCopy;
  sections: SiteSectionCopy;
  labels: SiteLabelCopy;
  pain: SitePainSectionCopy;
  competitorsSection: SiteCompetitorsSectionCopy;
  metrics: SiteMetric[];
  products: SiteProduct[];
  techGroups: SiteTechGroup[];
  roadmap: SiteRoadmapItem[];
  communityCards: SiteLinkCard[];
  faq: SiteFaqItem[];
  ecosystemCards: Array<{ title: string; description: string }>;
  architectureSteps: string[];
  architectureLanes: string[];
  investorBullets: string[];
  painPoints: SitePainPoint[];
  competitors: SiteCompetitor[];
}

const SHARED_PRODUCTS: SiteProduct[] = [
  {
    id: 'roboqc-vision',
    title: 'RoboQC Vision',
    eyebrow: 'Inline Camera Inspection Module',
    description:
      'Real-time camera-based defect detection directly at production stations. Catches 90%+ of visual defects before they reach downstream stages — powered by Romeo FlexVision CV.',
    status: 'Pilot Ready',
    statusTone: 'success',
    tags: ['Camera AI', 'Real-time', 'CV', 'Romeo FlexVision'],
    repoUrl: SITE_LINKS.products.andrew,
  },
  {
    id: 'roboqc-analytics',
    title: 'RoboQC Analytics',
    eyebrow: 'Defect Intelligence Dashboard',
    description:
      'Multi-model analytics for quality trends, root-cause analysis, and station-level defect reporting. Operator dashboards with full inspection history and anomaly alerts.',
    status: 'Sprint 5',
    statusTone: 'warning',
    tags: ['LangGraph', 'SQL', 'Python', 'LiteLLM'],
    repoUrl: SITE_LINKS.products.romeo,
  },
  {
    id: 'roboqc-reporter',
    title: 'RoboQC Reporter',
    eyebrow: 'Automated Quality Reporting Pipeline',
    description:
      'End-to-end quality report generation: station snapshots, defect summaries, trend charts — delivered automatically via Telegram and dashboard after every shift.',
    status: 'Active',
    statusTone: 'info',
    tags: ['Telegram Bot', 'Reports', 'FFmpeg', 'Automation'],
    repoUrl: SITE_LINKS.products.bassito,
  },
  {
    id: 'roboqc-orchestrator',
    title: 'RoboQC Orchestrator',
    eyebrow: 'Multi-Station QC Coordinator',
    description:
      'Coordinates camera inspection across multiple production stations simultaneously. Manages inspection queues, review cycles, and operator escalation workflows at scale.',
    status: 'v1.0 released',
    statusTone: 'success',
    tags: ['Multi-station', 'Modular', 'QC Workflow', 'Orchestration'],
    repoUrl: SITE_LINKS.products.pinocut,
  },
];

const SHARED_TECH_GROUPS: SiteTechGroup[] = [
  { title: 'Vision & CV', items: ['Romeo FlexVision', 'Camera AI', 'OpenCV', 'YOLO'] },
  { title: 'Orchestration', items: ['LangGraph', 'ROMA', 'Moltis (Rust)'] },
  { title: 'AI Models', items: ['Claude Sonnet', 'GPT-4o-mini', 'LiteLLM'] },
  { title: 'Backend', items: ['Python', 'FastAPI', 'TypeScript', 'Node.js 24'] },
  { title: 'Data', items: ['PostgreSQL', 'Drizzle ORM', 'sqlglot', 'E2B Sandbox'] },
  { title: 'DevOps', items: ['GitHub Actions', 'Docker', 'Telegram Bot', 'GitHub Pages'] },
];

const SHARED_ROADMAP: SiteRoadmapItem[] = [
  {
    phase: 'Phase 1',
    title: 'Romeo FlexVision CV core & camera integration',
    description:
      'Core computer vision pipeline established: camera calibration, frame capture, Romeo FlexVision defect model integration, and inline detection loop.',
    status: 'Done',
    statusTone: 'success',
  },
  {
    phase: 'Phase 2',
    title: 'Station #2 pilot — real-time defect catching',
    description:
      'Live pilot at Station #2 catching assembly defects in real time. 90%+ catch rate validated against manual inspection baseline.',
    status: 'Done',
    statusTone: 'success',
  },
  {
    phase: 'Phase 3',
    title: 'Analytics dashboard & operator alerts',
    description:
      'Defect analytics dashboard with per-station metrics, shift summaries, and Telegram-based operator alert system.',
    status: 'Done',
    statusTone: 'success',
  },
  {
    phase: 'Phase 4 — Current',
    title: 'Multi-station orchestration (Moltis runtime)',
    description:
      'Scaling RoboQC to 5+ stations simultaneously with the Moltis Rust runtime bridge and central inspection queue management.',
    status: 'In Progress',
    statusTone: 'warning',
  },
  {
    phase: 'Next',
    title: 'Commercial pilot program & v1.0 GA',
    description:
      'Opening the RoboQC pilot program to manufacturing partners. Full product packaging, SLA definition, and public launch.',
    status: 'Planned',
    statusTone: 'muted',
  },
];

const SHARED_COMMUNITY: SiteLinkCard[] = [
  {
    title: 'GitHub',
    description: 'Repositories, CI workflows, implementation history, and the current product surface.',
    href: SITE_LINKS.github,
    action: 'View repositories',
  },
  {
    title: 'Telegram Bot',
    description:
      'Public entry point: @RomeoFlexVision_bot. Use it for product navigation, demo onboarding, and contact handoff.',
    href: SITE_LINKS.telegram,
    action: 'Open bot',
  },
  {
    title: 'LinkedIn',
    description: 'Product positioning, public updates, and investor-facing communication.',
    href: SITE_LINKS.linkedin,
    action: 'Open LinkedIn',
  },
];

const SHARED_FAQ: SiteFaqItem[] = [
  {
    question: 'What is RoboQC in one sentence?',
    answer:
      'RoboQC is a cognitive robot-camera that performs inline quality control at every production station — catching defects in real time before they reach the next stage.',
  },
  {
    question: 'How fast is defect detection?',
    answer:
      'Detection latency is under 50ms per frame. Operator alerts fire within 2 seconds of a confirmed defect, so issues are caught at station #2, not discovered at test #5.',
  },
  {
    question: 'Which production environments does RoboQC support?',
    answer:
      'RoboQC integrates with standard industrial cameras (USB, GigE, IP). It runs on-premise — no cloud dependency — and supports 5+ stations simultaneously through the Moltis orchestration layer.',
  },
  {
    question: 'What is the pilot program?',
    answer:
      'We run a 2-week paid pilot at one production station. You get the full RoboQC Vision module, defect catch-rate benchmarking against your manual baseline, and a daily quality report via Telegram.',
  },
  {
    question: 'How does RoboQC differ from LightGuide, Arkite, or Drishti?',
    answer:
      'RoboQC combines cognitive AI vision (Romeo FlexVision) with real-time orchestration across multiple stations. Competitors focus on visual work instructions (LightGuide, Arkite) or single-station analytics. RoboQC catches errors inline, not post-process.',
  },
  {
    question: 'What technology powers RoboQC?',
    answer:
      'The core is Romeo FlexVision computer vision. Orchestration runs on LangGraph + ROMA + Moltis (Rust runtime). Reporting is built on a Telegram-first pipeline with FastAPI backend and React dashboard.',
  },
];

const METRICS_BY_LANGUAGE: Record<Language, SiteMetric[]> = {
  en: [
    { label: 'Defects caught inline', value: 90, suffix: '%+' },
    { label: 'Detection latency (ms)', value: 50, suffix: '' },
    { label: 'Stations supported', value: 5, suffix: '+' },
    { label: 'Pilot weeks to deploy', value: 2, suffix: '' },
  ],
  ru: [
    { label: 'Дефектов ловим inline', value: 90, suffix: '%+' },
    { label: 'Задержка детекции (мс)', value: 50, suffix: '' },
    { label: 'Станций поддерживаем', value: 5, suffix: '+' },
    { label: 'Недели на пилот', value: 2, suffix: '' },
  ],
  he: [
    { label: 'פגמים שנתפסו inline', value: 90, suffix: '%+' },
    { label: 'זמן זיהוי (ms)', value: 50, suffix: '' },
    { label: 'תחנות נתמכות', value: 5, suffix: '+' },
    { label: 'שבועות להטמעה', value: 2, suffix: '' },
  ],
};

const SHARED_PAIN_POINTS_EN: SitePainPoint[] = [
  {
    icon: '🕵️',
    title: 'Defects found too late',
    description: 'You discover the problem at test #5, but it was made at station #2. Every hour of delay multiplies the scrap cost.',
  },
  {
    icon: '😴',
    title: 'Human inspectors miss things',
    description: 'Manual inspection fatigues. After hour 4, defect catch rates drop 30–40%. Night shifts are the worst.',
  },
  {
    icon: '📊',
    title: 'No real-time quality data',
    description: 'Shift reports arrive at end-of-day. By then, hundreds of defective units are already in the next stage.',
  },
  {
    icon: '📈',
    title: 'Hard to scale to new lines',
    description: 'Adding a new production station means hiring more inspectors. QC cost scales linearly with capacity.',
  },
  {
    icon: '💸',
    title: 'Expensive scrap and returns',
    description: 'Each late-caught defect costs 5–20× more than an inline catch. Customer returns damage more than just margins.',
  },
];

const SHARED_PAIN_POINTS_RU: SitePainPoint[] = [
  {
    icon: '🕵️',
    title: 'Дефекты находят слишком поздно',
    description: 'Проблему обнаруживают на тесте №5, хотя она возникла на станции №2. Каждый час задержки умножает стоимость брака.',
  },
  {
    icon: '😴',
    title: 'Ручной контроль устаёт и пропускает',
    description: 'Ручная инспекция утомляет. После 4 часов работы процент обнаружения дефектов падает на 30–40%. Ночные смены — ещё хуже.',
  },
  {
    icon: '📊',
    title: 'Нет данных о качестве в реальном времени',
    description: 'Отчёты о смене приходят в конце дня. К тому времени сотни бракованных деталей уже ушли на следующий этап.',
  },
  {
    icon: '📈',
    title: 'Сложно масштабировать контроль',
    description: 'Добавление новой станции означает найм новых контролёров. Затраты на QC растут линейно вместе с мощностью.',
  },
  {
    icon: '💸',
    title: 'Дорогой брак и возвраты',
    description: 'Дефект, пойманный поздно, обходится в 5–20 раз дороже, чем тот, что пойман inline. Возвраты от клиентов бьют не только по марже.',
  },
];

const SHARED_COMPETITORS: SiteCompetitor[] = [
  { name: 'RoboQC', inline: true, ai: true, multiStation: true, ru: true, fastPilot: true, isUs: true },
  { name: 'LightGuide', inline: false, ai: false, multiStation: true, ru: false, fastPilot: false, isUs: false },
  { name: 'Arkite', inline: true, ai: false, multiStation: true, ru: false, fastPilot: false, isUs: false },
  { name: 'Drishti', inline: true, ai: true, multiStation: false, ru: false, fastPilot: false, isUs: false },
  { name: 'Retrocausal', inline: true, ai: true, multiStation: false, ru: false, fastPilot: false, isUs: false },
];

const LOCALIZED_COPY: Record<
  Language,
  Omit<SiteCopy, 'metrics' | 'products' | 'techGroups' | 'roadmap' | 'communityCards' | 'faq'>
> = {
  en: {
    meta: {
      title: 'RoboQC — Cognitive QC Robot | Romeo FlexVision',
      description:
        'RoboQC catches 90%+ of production defects inline, at station #2, not at test #5. Powered by Romeo FlexVision computer vision.',
      ogTitle: 'RoboQC — Your Robot-Camera at Every Production Station',
      ogDescription: 'Inline quality control that never sleeps. 90% of errors caught in real time.',
    },
    nav: {
      ecosystem: 'How It Works',
      products: 'Products',
      stack: 'Tech Stack',
      roadmap: 'Roadmap',
      contact: 'Contact',
      github: 'GitHub',
      telegram: 'Telegram',
      linkedin: 'LinkedIn',
      openPlatform: 'Launch Pilot',
      signIn: 'Sign in',
      signOut: 'Sign out',
      menu: 'Menu',
      close: 'Close',
      openRepo: 'Open repository',
      quickLinks: 'Quick links',
      social: 'Social',
    },
    hero: {
      eyebrow: 'Inline Quality Control · Powered by Romeo FlexVision',
      title: 'RoboQC. Your robot-camera at every station.',
      subtitle:
        'Inline quality control that never sleeps. We catch 90%+ of defects in real time — at station #2, not at test #5.',
      primaryCta: 'Launch RoboQC Pilot',
      secondaryCta: 'View on GitHub',
      tertiaryCta: 'Launch Pilot',
      orbitTitle: 'RoboQC station map',
      orbitCaption:
        'One cognitive inspection layer coordinates cameras across all stations, queues defect reviews, and alerts operators instantly.',
    },
    sections: {
      ecosystem: 'One robot. Every station. Zero missed defects.',
      ecosystemDescription:
        'RoboQC wraps Romeo FlexVision computer vision in a production-ready inspection platform: cameras at stations, AI in the loop, operator alerts in real time.',
      products: 'The full RoboQC lineup',
      productsDescription:
        'Four modules built to cover the full QC lifecycle — from camera detection to multi-station orchestration and automated shift reporting.',
      stack: 'Tech stack: vision, orchestration, data, and reporting',
      stackDescription:
        'Romeo FlexVision CV at the core. LangGraph + Moltis for multi-station orchestration. Telegram-first operator interface. FastAPI + React dashboard.',
      architecture: 'How RoboQC detects defects',
      architectureDescription:
        'Every frame moves through capture, model inference, threshold validation, and operator alert pipeline — all under 50ms.',
      roadmap: 'Roadmap to RoboQC v1.0 GA',
      roadmapDescription:
        'From single-station pilot to multi-station orchestration — the public roadmap shows where RoboQC stands and where it is going.',
      investors: 'For investors and manufacturing partners',
      investorsDescription:
        'RoboQC is built on proven Romeo FlexVision technology with a clear path from pilot to production deployment at scale.',
      community: 'Community, pilot access, and repositories',
      communityDescription:
        'GitHub, Telegram, and LinkedIn are the current public surfaces where RoboQC is documented and pilot requests are handled.',
      faq: 'FAQ for plant managers and decision makers',
      faqDescription:
        'A concise FAQ for production engineers, quality managers, and anyone evaluating inline AI quality control.',
    },
    labels: {
      centralNode: 'RoboQC Hub',
      sharedControlPlane: 'Inline inspection layer',
      sharedControlPlaneDescription:
        'Camera frames, defect classifications, operator alerts, and shift reports all flow through one centralized inspection control plane.',
      crossDomainExecution: 'Multi-station coverage',
      crossDomainExecutionDescription:
        'RoboQC coordinates inspection across 5+ stations simultaneously — the same cognitive model, everywhere on the line.',
      humanLoop: 'Operator-in-the-loop',
      humanLoopDescription:
        'Confidence gates are operator-visible. When defect likelihood crosses the threshold, the human is notified before the part moves on.',
      builtWith: 'Powered by Romeo FlexVision',
      footerSummary:
        'RoboQC is a cognitive robot-inspector built on Romeo FlexVision. It catches production defects inline — at station #2, not at test #5.',
      footerStack: 'Romeo FlexVision · LangGraph · FastAPI · React · Telegram · Moltis runtime.',
      rights: '(c) 2026 RoboQC | Romeo FlexVision. All rights reserved.',
      investorCta: 'Open Telegram',
      roadmapStep: 'Phase',
    },
    ecosystemCards: [
      {
        title: 'Inline inspection layer',
        description:
          'Camera frames are processed in real time at the station — defect detection happens before the part ever reaches the next step.',
      },
      {
        title: 'Multi-station coverage',
        description:
          'RoboQC Orchestrator coordinates inspection across 5+ stations from a single control plane, without adding headcount.',
      },
      {
        title: 'Operator-in-the-loop alerts',
        description:
          'When a defect is confirmed, the operator is alerted within 2 seconds via dashboard and Telegram — before the part moves on.',
      },
    ],
    architectureSteps: [
      'Camera Frame',
      'Romeo FlexVision CV',
      'Defect Model',
      'Threshold Gate',
      'Operator Alert',
      'Shift Report',
    ],
    architectureLanes: [
      'USB / GigE / IP camera input',
      'Romeo FlexVision inference < 50ms',
      'Confidence threshold validation',
      'Telegram operator alert (< 2s)',
      'Defect log & analytics storage',
      'Automated shift PDF/dashboard report',
    ],
    investorBullets: [
      'Proven Romeo FlexVision CV core with 90%+ inline defect catch rate validated in pilot.',
      'Multi-station orchestration via Moltis runtime — scales without linear headcount growth.',
      'Clear path from 2-week paid pilot to full production deployment contract.',
    ],
    pain: {
      kicker: 'Why RoboQC',
      title: '5 pains RoboQC takes away overnight',
      description:
        'Every manufacturing plant with manual QC faces the same five problems. RoboQC eliminates them at the source.',
    },
    competitorsSection: {
      kicker: 'Competitive landscape',
      title: 'Romeo FlexVision vs LightGuide, Arkite, Drishti, Retrocausal',
      description:
        'Most competitors solve one piece of the puzzle. RoboQC is the only solution combining cognitive AI vision with multi-station real-time orchestration.',
      featureInline: 'Inline real-time detection',
      featureAi: 'Cognitive AI vision',
      featureMulti: 'Multi-station',
      featureRu: 'Russian market support',
      featurePilot: '2-week fast pilot',
    },
  },
  ru: {
    meta: {
      title: 'RoboQC — Когнитивный QC-робот | Romeo FlexVision',
      description:
        'RoboQC ловит 90%+ производственных дефектов inline — на станции №2, а не на тесте №5. Технология Romeo FlexVision.',
      ogTitle: 'RoboQC — Твой робот-камера на каждой станции',
      ogDescription: 'Inline контроль качества. 90% ошибок ловим в реальном времени.',
    },
    nav: {
      ecosystem: 'Как работает',
      products: 'Продукты',
      stack: 'Техстек',
      roadmap: 'Roadmap',
      contact: 'Контакты',
      github: 'GitHub',
      telegram: 'Telegram',
      linkedin: 'LinkedIn',
      openPlatform: 'Запустить пилот',
      signIn: 'Войти',
      signOut: 'Выйти',
      menu: 'Меню',
      close: 'Закрыть',
      openRepo: 'Открыть репозиторий',
      quickLinks: 'Быстрые ссылки',
      social: 'Соцсети',
    },
    hero: {
      eyebrow: 'Inline контроль качества · На базе Romeo FlexVision',
      title: 'RoboQC. Твой робот-камера на каждой станции.',
      subtitle:
        'Inline контроль качества, который никогда не спит. 90% ошибок ловим в реальном времени — на станции №2, а не на тесте №5.',
      primaryCta: 'Запустить RoboQC-пилот',
      secondaryCta: 'Смотреть на GitHub',
      tertiaryCta: 'Запустить пилот',
      orbitTitle: 'Карта станций RoboQC',
      orbitCaption:
        'Один когнитивный слой инспекции координирует камеры по всем станциям, ставит дефекты в очередь проверки и мгновенно оповещает оператора.',
    },
    sections: {
      ecosystem: 'Один робот. Каждая станция. Ноль пропущенных дефектов.',
      ecosystemDescription:
        'RoboQC оборачивает компьютерное зрение Romeo FlexVision в production-ready платформу инспекции: камеры на станциях, AI в петле, оповещения оператора в реальном времени.',
      products: 'Вся линейка RoboQC',
      productsDescription:
        'Четыре модуля для полного цикла QC — от детекции камерой до оркестрации нескольких станций и автоматической отчётности по сменам.',
      stack: 'Техстек: зрение, оркестрация, данные и отчётность',
      stackDescription:
        'Ядро — Romeo FlexVision CV. Оркестрация — LangGraph + Moltis. Интерфейс оператора — Telegram. Дашборд — FastAPI + React.',
      architecture: 'Как RoboQC обнаруживает дефекты',
      architectureDescription:
        'Каждый кадр проходит захват, инференс модели, валидацию порога и пайплайн оповещения оператора — всё за 50 мс.',
      roadmap: 'Roadmap к RoboQC v1.0 GA',
      roadmapDescription:
        'От пилота на одной станции к оркестрации нескольких станций — публичная дорожная карта показывает, где RoboQC сейчас и куда движется.',
      investors: 'Для инвесторов и производственных партнёров',
      investorsDescription:
        'RoboQC построен на проверенной технологии Romeo FlexVision с чётким путём от пилота к полному производственному развёртыванию.',
      community: 'Сообщество, доступ к пилоту и репозитории',
      communityDescription:
        'GitHub, Telegram и LinkedIn — публичные поверхности, где RoboQC документируется и принимаются заявки на пилот.',
      faq: 'FAQ для руководителей производства и инженеров качества',
      faqDescription:
        'Короткий FAQ для производственных инженеров, менеджеров качества и всех, кто рассматривает inline AI-контроль качества.',
    },
    labels: {
      centralNode: 'Хаб RoboQC',
      sharedControlPlane: 'Слой inline-инспекции',
      sharedControlPlaneDescription:
        'Кадры с камер, классификации дефектов, оповещения операторов и отчёты по сменам — всё течёт через единую control plane инспекции.',
      crossDomainExecution: 'Покрытие нескольких станций',
      crossDomainExecutionDescription:
        'RoboQC координирует инспекцию 5+ станций одновременно — одна когнитивная модель, везде на линии.',
      humanLoop: 'Оператор в петле',
      humanLoopDescription:
        'Пороги уверенности видимы оператору. Когда вероятность дефекта пересекает порог, человек получает уведомление до перемещения детали.',
      builtWith: 'На базе Romeo FlexVision',
      footerSummary:
        'RoboQC — когнитивный робот-инспектор на базе Romeo FlexVision. Ловит производственные дефекты inline — на станции №2, а не на тесте №5.',
      footerStack: 'Romeo FlexVision · LangGraph · FastAPI · React · Telegram · Moltis runtime.',
      rights: '(c) 2026 RoboQC | Romeo FlexVision. Все права защищены.',
      investorCta: 'Открыть Telegram',
      roadmapStep: 'Фаза',
    },
    ecosystemCards: [
      {
        title: 'Слой inline-инспекции',
        description:
          'Кадры с камеры обрабатываются в реальном времени прямо на станции — обнаружение дефектов происходит до перехода детали на следующий этап.',
      },
      {
        title: 'Покрытие нескольких станций',
        description:
          'RoboQC Orchestrator координирует инспекцию 5+ станций с единой control plane — без увеличения штата контролёров.',
      },
      {
        title: 'Оповещение оператора в петле',
        description:
          'При подтверждении дефекта оператор получает уведомление в течение 2 секунд через дашборд и Telegram — до перемещения детали.',
      },
    ],
    architectureSteps: [
      'Кадр с камеры',
      'Romeo FlexVision CV',
      'Модель дефектов',
      'Порог уверенности',
      'Оповещение оператора',
      'Отчёт по смене',
    ],
    architectureLanes: [
      'USB / GigE / IP камера',
      'Инференс Romeo FlexVision < 50мс',
      'Валидация порога уверенности',
      'Telegram-оповещение оператора (< 2с)',
      'Лог дефектов и аналитическое хранилище',
      'Автоматический PDF/дашборд-отчёт по смене',
    ],
    investorBullets: [
      'Проверенное ядро Romeo FlexVision CV с уловом 90%+ дефектов inline, подтверждённым на пилоте.',
      'Оркестрация нескольких станций через Moltis runtime — масштабирование без линейного роста штата.',
      'Чёткий путь от 2-недельного платного пилота к полному контракту на производственное развёртывание.',
    ],
    pain: {
      kicker: 'Зачем RoboQC',
      title: '5 болей, которые RoboQC забирает за одну ночь',
      description:
        'Каждое производство с ручным QC сталкивается с одними и теми же пятью проблемами. RoboQC устраняет их в источнике.',
    },
    competitorsSection: {
      kicker: 'Конкурентная карта',
      title: 'Romeo FlexVision vs LightGuide, Arkite, Drishti, Retrocausal',
      description:
        'Большинство конкурентов решают только один кусочек головоломки. RoboQC — единственное решение, объединяющее когнитивное AI-зрение с оркестрацией нескольких станций в реальном времени.',
      featureInline: 'Inline-детекция в реальном времени',
      featureAi: 'Когнитивное AI-зрение',
      featureMulti: 'Несколько станций',
      featureRu: 'Поддержка российского рынка',
      featurePilot: 'Быстрый пилот за 2 недели',
    },
  },
  he: {
    meta: {
      title: 'RoboQC — רובוט QC קוגניטיבי | Romeo FlexVision',
      description:
        'RoboQC תופס 90%+ מפגמי ייצור inline — בתחנה #2, לא בבדיקה #5. מופעל על ידי Romeo FlexVision.',
      ogTitle: 'RoboQC — המצלמה הרובוטית שלך בכל תחנה',
      ogDescription: 'בקרת איכות inline שלעולם לא ישנה. 90% מהשגיאות נתפסות בזמן אמת.',
    },
    nav: {
      ecosystem: 'אקוסיסטם',
      products: 'מוצרים',
      stack: 'Tech Stack',
      roadmap: 'Roadmap',
      contact: 'יצירת קשר',
      github: 'GitHub',
      telegram: 'Telegram',
      linkedin: 'LinkedIn',
      openPlatform: 'פתח פלטפורמה',
      signIn: 'התחבר',
      signOut: 'התנתק',
      menu: 'תפריט',
      close: 'סגור',
      openRepo: 'פתח ריפו',
      quickLinks: 'קישורים מהירים',
      social: 'קהילה',
    },
    hero: {
      eyebrow: 'בקרת איכות Inline · מופעל על ידי Romeo FlexVision',
      title: 'RoboQC. המצלמה הרובוטית שלך בכל תחנה.',
      subtitle:
        'בקרת איכות inline שלעולם לא ישנה. אנחנו תופסים 90%+ מהפגמים בזמן אמת — בתחנה #2, לא בבדיקה #5.',
      primaryCta: 'הפעל פיילוט RoboQC',
      secondaryCta: 'צפה ב-GitHub',
      tertiaryCta: 'הפעל פיילוט',
      orbitTitle: 'מפת תחנות RoboQC',
      orbitCaption:
        'שכבת בדיקה קוגניטיבית אחת מתאמת מצלמות בכל התחנות, מכניסה פגמים לתור בדיקה ומתריעה למפעיל מיד.',
    },
    sections: {
      ecosystem: 'רובוט אחד. כל תחנה. אפס פגמים שמוחמצים.',
      ecosystemDescription:
        'RoboQC עוטף ראיית מחשב Romeo FlexVision בפלטפורמת בדיקה מוכנה לייצור: מצלמות בתחנות, AI בלולאה, התראות מפעיל בזמן אמת.',
      products: 'כל קו המוצרים של RoboQC',
      productsDescription:
        'ארבעה מודולים לכיסוי מחזור QC המלא — מזיהוי מצלמה ועד תיאום תחנות מרובות ודיווח אוטומטי על משמרות.',
      stack: 'Tech stack: ראייה, תזמור, נתונים ודיווח',
      stackDescription:
        'ליבת Romeo FlexVision CV. תזמור LangGraph + Moltis. ממשק מפעיל Telegram. דשבורד FastAPI + React.',
      architecture: 'איך RoboQC מזהה פגמים',
      architectureDescription:
        'כל פריים עובר לכידה, הסקת מסקנות מודל, אימות סף והתראת מפעיל — הכל תוך 50ms.',
      roadmap: 'Roadmap ל-RoboQC v1.0 GA',
      roadmapDescription:
        'מפיילוט בתחנה אחת לתיאום תחנות מרובות — מפת הדרכים הציבורית מציגה היכן RoboQC נמצא והלאן הוא הולך.',
      investors: 'למשקיעים ולשותפי ייצור',
      investorsDescription:
        'RoboQC בנוי על טכנולוגיית Romeo FlexVision מוכחת עם נתיב ברור מפיילוט לפריסת ייצור מלאה.',
      community: 'קהילה, גישה לפיילוט ומאגרים',
      communityDescription:
        'GitHub, Telegram ו-LinkedIn הם המשטחים הציבוריים שבהם RoboQC מתועד ומטפל בבקשות פיילוט.',
      faq: 'FAQ למנהלי מפעל ומהנדסי איכות',
      faqDescription:
        'FAQ תמציתי למהנדסי ייצור, מנהלי איכות וכל מי שמעריך בקרת איכות AI inline.',
    },
    labels: {
      centralNode: 'RoboQC Hub',
      sharedControlPlane: 'שכבת בדיקה inline',
      sharedControlPlaneDescription:
        'פריימים ממצלמה, סיווגי פגמים, התראות מפעיל ודוחות משמרת — הכל זורם דרך control plane בדיקה מרכזית אחת.',
      crossDomainExecution: 'כיסוי תחנות מרובות',
      crossDomainExecutionDescription:
        'RoboQC מתאם בדיקה ב-5+ תחנות בו-זמנית — אותו מודל קוגניטיבי, בכל מקום על הקו.',
      humanLoop: 'מפעיל בלולאה',
      humanLoopDescription:
        'ספי ביטחון גלויים למפעיל. כאשר הסתברות פגם חוצה את הסף, האדם מקבל הודעה לפני שהחלק זזה.',
      builtWith: 'מופעל על ידי Romeo FlexVision',
      footerSummary:
        'RoboQC הוא רובוט-בודק קוגניטיבי הבנוי על Romeo FlexVision. תופס פגמי ייצור inline — בתחנה #2, לא בבדיקה #5.',
      footerStack: 'Romeo FlexVision · LangGraph · FastAPI · React · Telegram · Moltis runtime.',
      rights: '(c) 2026 RoboQC | Romeo FlexVision. כל הזכויות שמורות.',
      investorCta: 'פתח Telegram',
      roadmapStep: 'שלב',
    },
    ecosystemCards: [
      {
        title: 'שכבת בדיקה inline',
        description:
          'פריימים ממצלמה מעובדים בזמן אמת בתחנה — זיהוי פגמים מתרחש לפני שהחלק מגיע לשלב הבא.',
      },
      {
        title: 'כיסוי תחנות מרובות',
        description:
          'RoboQC Orchestrator מתאם בדיקה ב-5+ תחנות מ-control plane אחת — ללא הגדלת צוות.',
      },
      {
        title: 'התראת מפעיל בלולאה',
        description:
          'כאשר פגם מאושר, המפעיל מקבל התראה תוך 2 שניות דרך דשבורד ו-Telegram — לפני שהחלק זזה.',
      },
    ],
    architectureSteps: [
      'פריים ממצלמה',
      'Romeo FlexVision CV',
      'מודל פגמים',
      'שער סף',
      'התראת מפעיל',
      'דוח משמרת',
    ],
    architectureLanes: [
      'USB / GigE / IP קלט מצלמה',
      'הסקת Romeo FlexVision < 50ms',
      'אימות סף ביטחון',
      'התראת Telegram למפעיל (< 2s)',
      'לוג פגמים ואחסון אנליטיקה',
      'דוח PDF/דשבורד אוטומטי למשמרת',
    ],
    investorBullets: [
      'ליבת Romeo FlexVision CV מוכחת עם שיעור תפיסת פגמים 90%+ inline מאומת בפיילוט.',
      'תזמור תחנות מרובות דרך Moltis runtime — מסקלים ללא צמיחה לינארית בכוח אדם.',
      'נתיב ברור מפיילוט בתשלום של שבועיים לחוזה פריסת ייצור מלאה.',
    ],
    pain: {
      kicker: 'למה RoboQC',
      title: '5 כאבים ש-RoboQC לוקח בלילה אחד',
      description:
        'כל מפעל עם QC ידני מתמודד עם אותן חמש בעיות. RoboQC מבטל אותן במקור.',
    },
    competitorsSection: {
      kicker: 'נוף תחרותי',
      title: 'Romeo FlexVision vs LightGuide, Arkite, Drishti, Retrocausal',
      description:
        'רוב המתחרים פותרים רק חתיכה אחת של הפאזל. RoboQC הוא הפתרון היחיד המשלב ראיית AI קוגניטיבית עם תיאום תחנות מרובות בזמן אמת.',
      featureInline: 'זיהוי inline בזמן אמת',
      featureAi: 'ראיית AI קוגניטיבית',
      featureMulti: 'תחנות מרובות',
      featureRu: 'תמיכה בשוק הרוסי',
      featurePilot: 'פיילוט מהיר 2 שבועות',
    },
  },
};

export function getSiteContent(language: Language): SiteCopy {
  return {
    ...LOCALIZED_COPY[language],
    metrics: METRICS_BY_LANGUAGE[language],
    products: SHARED_PRODUCTS,
    techGroups: SHARED_TECH_GROUPS,
    roadmap: SHARED_ROADMAP,
    communityCards: SHARED_COMMUNITY,
    faq: SHARED_FAQ,
    painPoints: language === 'ru' ? SHARED_PAIN_POINTS_RU : SHARED_PAIN_POINTS_EN,
    competitors: SHARED_COMPETITORS,
  };
}
