import type { Language } from '../context/LanguageContext';

export const SITE_LINKS = {
  github: 'https://github.com/aleksandrlyubarev-blip',
  telegram: 'https://t.me/RomeoFlexVision_bot',
  telegramHandle: '@RomeoFlexVision_bot',
  linkedin: 'https://www.linkedin.com/company/112507945/',
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
}

const SHARED_PRODUCTS: SiteProduct[] = [
  {
    id: 'andrew-analytic',
    title: 'Andrew Swarm',
    eyebrow: 'Data Science Orchestration Agent',
    description:
      'Multi-model routing with sqlglot validation, AST safety, and sandboxed execution for analytics-heavy technical workflows.',
    status: 'Sprint 5 - Moltis integration',
    statusTone: 'warning',
    tags: ['LangGraph', 'SQL', 'Python', 'LiteLLM'],
    repoUrl: SITE_LINKS.products.andrew,
  },
  {
    id: 'romeo-phd',
    title: 'Romeo PhD',
    eyebrow: 'Educational AI Companion',
    description:
      'A TypeScript monorepo for pedagogical explanation, technical tutoring, and developer-friendly reasoning flows.',
    status: 'v6.0',
    statusTone: 'success',
    tags: ['TypeScript', 'React 19', 'Claude API', 'PostgreSQL'],
    repoUrl: SITE_LINKS.products.romeo,
  },
  {
    id: 'bassito-animator',
    title: 'Bassito',
    eyebrow: 'Automated Video Production Pipeline',
    description:
      'Script to background, voice, lip-sync, CTA5, and FFmpeg compositing through a Telegram-first production loop.',
    status: 'Active pipeline',
    statusTone: 'info',
    tags: ['FFmpeg', 'CTA5', 'Google Drive', 'Telegram Bot'],
    repoUrl: SITE_LINKS.products.bassito,
  },
  {
    id: 'pino-cut',
    title: 'PinoCut',
    eyebrow: 'Modular AI Video Assembly Agent',
    description:
      'A scene assembly codebase that plugs into the wider ecosystem for automated rough cuts, structured timelines, and scene review.',
    status: 'v1.0 released',
    statusTone: 'success',
    tags: ['Video Assembly', 'Modular', 'Andrew Swarm', 'Scene Stitcher'],
    repoUrl: SITE_LINKS.products.pinocut,
  },
];

const SHARED_TECH_GROUPS: SiteTechGroup[] = [
  { title: 'Orchestration', items: ['LangGraph', 'ROMA', 'Moltis (Rust)'] },
  { title: 'AI Models', items: ['Claude Sonnet', 'GPT-4o-mini', 'Grok 4', 'LiteLLM'] },
  { title: 'Backend', items: ['Python', 'FastAPI', 'TypeScript', 'Node.js 24', 'Express 5'] },
  { title: 'Data', items: ['PostgreSQL', 'Drizzle ORM', 'sqlglot', 'E2B Sandbox'] },
  { title: 'Media', items: ['FFmpeg', 'CTA5', 'Google Drive API'] },
  { title: 'DevOps', items: ['GitHub Actions', 'Docker', 'GitHub Pages'] },
];

const SHARED_ROADMAP: SiteRoadmapItem[] = [
  {
    phase: 'Sprints 1-2',
    title: 'LangGraph foundations and core pipelines',
    description:
      'StateGraph orchestration, SQL/Python execution paths, and LiteLLM abstraction were established.',
    status: 'Done',
    statusTone: 'success',
  },
  {
    phase: 'Sprint 3',
    title: 'Column-level validation and AST safety',
    description:
      'sqlglot guards and AST visitors reduced unsafe execution paths and improved explainability.',
    status: 'Done',
    statusTone: 'success',
  },
  {
    phase: 'Sprint 4',
    title: 'Weighted routing and model lanes',
    description:
      '48-keyword routing and three model lanes turned the stack into a real multi-model orchestrator.',
    status: 'Done',
    statusTone: 'success',
  },
  {
    phase: 'Sprint 5',
    title: 'Moltis bridge and runtime hardening',
    description:
      'The current focus is a Rust runtime bridge through FastAPI to strengthen throughput and execution reliability.',
    status: 'In Progress',
    statusTone: 'warning',
  },
  {
    phase: 'Next',
    title: 'Investor positioning and v1.0 GA',
    description:
      'The public narrative, product packaging, and distribution loop are being aligned for the next release milestone.',
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
    question: 'What is RomeoFlexVision in one sentence?',
    answer:
      'It is an agentic AI ecosystem connecting research, orchestration, analytics, and automated media production.',
  },
  {
    question: 'Is this a single chatbot or a multi-agent system?',
    answer:
      'It is explicitly a multi-agent system coordinated through ROMA and supported by dedicated product surfaces.',
  },
  {
    question: 'What is already real versus planned?',
    answer:
      'The repos, CI workflows, SceneOps seams, media pipeline scaffolding, and product shells are real. Moltis runtime hardening is in progress.',
  },
  {
    question: 'Why combine data science and media production?',
    answer:
      'Because the platform goal is one orchestrated operating layer that can inspect, explain, and generate operational assets in the same workflow.',
  },
  {
    question: 'How should the Telegram bot be used?',
    answer:
      'As the fastest public entry point: launch demos, route visitors to GitHub and product pages, collect inbound requests, and hand off qualified conversations into Telegram or email.',
  },
];

const METRICS_BY_LANGUAGE: Record<Language, SiteMetric[]> = {
  en: [
    { label: 'Lines of code', value: 10000, suffix: '+' },
    { label: 'Tests passing', value: 27, suffix: '/27' },
    { label: 'AI models integrated', value: 3, suffix: '+' },
    { label: 'Pipeline stages', value: 5, suffix: '' },
  ],
  ru: [
    { label: 'Строк кода', value: 10000, suffix: '+' },
    { label: 'Тестов пройдено', value: 27, suffix: '/27' },
    { label: 'Интегрировано AI-моделей', value: 3, suffix: '+' },
    { label: 'Стадий пайплайна', value: 5, suffix: '' },
  ],
  he: [
    { label: 'שורות קוד', value: 10000, suffix: '+' },
    { label: 'בדיקות עוברות', value: 27, suffix: '/27' },
    { label: 'מודלי AI משולבים', value: 3, suffix: '+' },
    { label: 'שלבי pipeline', value: 5, suffix: '' },
  ],
};

const LOCALIZED_COPY: Record<
  Language,
  Omit<SiteCopy, 'metrics' | 'products' | 'techGroups' | 'roadmap' | 'communityCards' | 'faq'>
> = {
  en: {
    meta: {
      title: 'RomeoFlexVision | Agentic AI Ecosystem',
      description:
        'Multi-agent orchestration for data science and automated media production. Explore Andrew Swarm, Romeo PhD, Bassito, and PinoCut.',
      ogTitle: 'RomeoFlexVision | Agentic AI Ecosystem',
      ogDescription: 'Building the future of AI agent orchestration for data science and media production.',
    },
    nav: {
      ecosystem: 'Ecosystem',
      products: 'Products',
      stack: 'Tech Stack',
      roadmap: 'Roadmap',
      contact: 'Contact',
      github: 'GitHub',
      telegram: 'Telegram',
      openPlatform: 'Open Platform',
      signIn: 'Sign in',
      signOut: 'Sign out',
      menu: 'Menu',
      close: 'Close',
      openRepo: 'Open repository',
      quickLinks: 'Quick links',
      social: 'Social',
    },
    hero: {
      eyebrow: 'Agentic AI Ecosystem for Data Science and Media Production',
      title: 'Building the Agentic AI Ecosystem',
      subtitle:
        'Multi-agent orchestration for data science and media production, powered by ROMA, LangGraph, and the next Moltis runtime layer.',
      primaryCta: 'Explore Products',
      secondaryCta: 'View on GitHub',
      tertiaryCta: 'Open Platform',
      orbitTitle: 'ROMA orchestration map',
      orbitCaption:
        'A single operator layer coordinates analytics, education, automated video production, and modular post-processing.',
    },
    sections: {
      ecosystem: 'One ecosystem. Four agents. Infinite possibilities.',
      ecosystemDescription:
        'The public landing page is structured around one control plane: ROMA routes work, while specialized products execute it.',
      products: 'Products built for real operator workflows',
      productsDescription:
        'Each product surface solves a distinct role, but the real leverage comes from their shared orchestration model.',
      stack: 'Tech stack across orchestration, inference, data, and media',
      stackDescription:
        'The stack is intentionally hybrid: orchestration-heavy, model-flexible, and practical for both developer tools and media automation.',
      architecture: 'How Andrew Swarm routes technical work',
      architectureDescription:
        'Queries move through routing, lane selection, validation, and sandboxing before they ever become execution.',
      roadmap: 'Roadmap toward RomeoFlexVision v1.0',
      roadmapDescription:
        'The public roadmap shows how the ecosystem moved from orchestration foundations into runtime hardening and product positioning.',
      investors: 'For investors and strategic partners',
      investorsDescription:
        'RomeoFlexVision is being shaped as a visible, inspectable product ecosystem rather than an abstract AI concept.',
      community: 'Community, product access, and repositories',
      communityDescription:
        'GitHub, Telegram, and LinkedIn are the current public surfaces where the ecosystem is documented and distributed.',
      faq: 'FAQ for developers and decision makers',
      faqDescription:
        'A concise technical FAQ for developers, partners, and anyone trying to understand where the ecosystem stands today.',
    },
    labels: {
      centralNode: 'Central node',
      sharedControlPlane: 'Shared control plane',
      sharedControlPlaneDescription:
        'Routing, validation, review loops, and cost visibility are handled as platform behavior, not as disconnected scripts.',
      crossDomainExecution: 'Cross-domain execution',
      crossDomainExecutionDescription:
        'The ecosystem supports data science, educational explanation, automated video production, and modular scene assembly in one narrative.',
      humanLoop: 'Human-in-the-loop',
      humanLoopDescription:
        'Confidence gates stay inspectable. Operators remain in control when uncertainty crosses the threshold.',
      builtWith: 'Built with Claude + LangGraph',
      footerSummary:
        'RomeoFlexVision is a public build log and product surface for agentic AI orchestration across data science and media production.',
      footerStack: 'FastAPI, TypeScript, React, FFmpeg, and developer-first AI tooling.',
      rights: '(c) 2026 RomeoFlexVision. All rights reserved.',
      investorCta: 'Open Telegram',
      roadmapStep: 'Step',
    },
    ecosystemCards: [
      {
        title: 'Shared control plane',
        description:
          'Routing, validation, review loops, and FinOps visibility live at the platform level rather than inside isolated tools.',
      },
      {
        title: 'Cross-domain execution',
        description:
          'The same ecosystem supports data science, educational explanation, video automation, and structured scene assembly.',
      },
      {
        title: 'Human-in-the-loop review',
        description:
          'Confidence and quality gates remain visible so an operator can intervene before the workflow drifts.',
      },
    ],
    architectureSteps: [
      'User Query',
      'Keyword Router',
      'Model Lane',
      'sqlglot Validation',
      'AST Safety',
      'Sandbox Response',
    ],
    architectureLanes: [
      'Reasoning / Math -> Grok 4',
      'Analytics -> GPT-4o-mini',
      'Standard -> Claude Sonnet',
      'sqlglot column-level validation',
      'AST visitor safety guard',
      'E2B sandbox execution',
    ],
    investorBullets: [
      'Multi-agent stack with clear product surfaces instead of one generic assistant.',
      'Routing, validation, and HITL checkpoints make the system inspectable by design.',
      'A path from developer tooling into operator-facing workflow products.',
    ],
  },
  ru: {
    meta: {
      title: 'RomeoFlexVision | Агентная AI-экосистема',
      description:
        'Мультиагентная оркестрация для data science и автоматизированного медиа-производства. Andrew Swarm, Romeo PhD, Bassito и PinoCut.',
      ogTitle: 'RomeoFlexVision | Агентная AI-экосистема',
      ogDescription: 'AI-оркестрация для data science и media production.',
    },
    nav: {
      ecosystem: 'Экосистема',
      products: 'Продукты',
      stack: 'Техстек',
      roadmap: 'Roadmap',
      contact: 'Контакты',
      github: 'GitHub',
      telegram: 'Telegram',
      openPlatform: 'Открыть платформу',
      signIn: 'Войти',
      signOut: 'Выйти',
      menu: 'Меню',
      close: 'Закрыть',
      openRepo: 'Открыть репозиторий',
      quickLinks: 'Быстрые ссылки',
      social: 'Соцсети',
    },
    hero: {
      eyebrow: 'Agentic AI Ecosystem для Data Science и Media Production',
      title: 'Создаём агентную AI-экосистему',
      subtitle:
        'Мультиагентная оркестрация для data science и media production на базе ROMA, LangGraph и следующего runtime-слоя Moltis.',
      primaryCta: 'Изучить продукты',
      secondaryCta: 'Смотреть на GitHub',
      tertiaryCta: 'Открыть платформу',
      orbitTitle: 'Карта оркестрации ROMA',
      orbitCaption:
        'Один операторный слой координирует аналитику, обучение, автоматизированное видео-производство и модульный постпроцессинг.',
    },
    sections: {
      ecosystem: 'Одна экосистема. Четыре агента. Бесконечные комбинации.',
      ecosystemDescription:
        'Публичный лендинг строится вокруг единой control plane: ROMA маршрутизирует работу, а специализированные продукты её исполняют.',
      products: 'Продукты для реальных операторных сценариев',
      productsDescription:
        'Каждый продукт решает отдельную роль, но главное преимущество появляется за счёт общей модели оркестрации.',
      stack: 'Техстек для оркестрации, inference, данных и медиа',
      stackDescription:
        'Стек намеренно гибридный: сильная оркестрация, свобода выбора моделей и практичность для developer tools и media automation.',
      architecture: 'Как Andrew Swarm маршрутизирует техническую работу',
      architectureDescription:
        'Запрос проходит маршрутизацию, выбор модельной полосы, валидацию и sandboxing ещё до фактического выполнения.',
      roadmap: 'Roadmap к RomeoFlexVision v1.0',
      roadmapDescription:
        'Публичная дорожная карта показывает переход от foundations оркестрации к runtime hardening и продуктовой упаковке.',
      investors: 'Для инвесторов и стратегических партнёров',
      investorsDescription:
        'RomeoFlexVision формируется как наблюдаемая продуктовая экосистема, а не как абстрактная AI-идея.',
      community: 'Сообщество, доступ к продукту и репозитории',
      communityDescription:
        'GitHub, Telegram и LinkedIn сейчас являются главными публичными поверхностями, где документируется и распространяется экосистема.',
      faq: 'FAQ для разработчиков и лиц, принимающих решения',
      faqDescription:
        'Короткий технический FAQ для разработчиков, партнёров и тех, кто хочет понять текущее состояние экосистемы.',
    },
    labels: {
      centralNode: 'Центральный узел',
      sharedControlPlane: 'Единая control plane',
      sharedControlPlaneDescription:
        'Маршрутизация, валидация, review-циклы и контроль стоимости реализованы как поведение платформы, а не как набор разрозненных скриптов.',
      crossDomainExecution: 'Кросс-доменное исполнение',
      crossDomainExecutionDescription:
        'Экосистема поддерживает data science, объяснение, автоматизированное видео-производство и модульную сборку сцен в одном нарративе.',
      humanLoop: 'Human-in-the-loop',
      humanLoopDescription:
        'Уровни уверенности и quality gates остаются видимыми, чтобы оператор мог вмешаться до того, как workflow уйдёт в дрейф.',
      builtWith: 'Собрано с Claude + LangGraph',
      footerSummary:
        'RomeoFlexVision — это публичный build log и продуктовая поверхность для агентной AI-оркестрации в data science и media production.',
      footerStack: 'FastAPI, TypeScript, React, FFmpeg и AI-инструменты с developer-first подходом.',
      rights: '(c) 2026 RomeoFlexVision. Все права защищены.',
      investorCta: 'Открыть Telegram',
      roadmapStep: 'Шаг',
    },
    ecosystemCards: [
      {
        title: 'Единая control plane',
        description:
          'Маршрутизация, валидация, review-циклы и FinOps-наблюдаемость живут на уровне платформы, а не внутри изолированных тулов.',
      },
      {
        title: 'Кросс-доменное исполнение',
        description:
          'Одна и та же экосистема покрывает data science, образовательное объяснение, video automation и структурированную сборку сцен.',
      },
      {
        title: 'Human-in-the-loop review',
        description:
          'Уровни уверенности и контроль качества остаются видимыми, чтобы оператор мог вмешаться до ухода workflow в дрейф.',
      },
    ],
    architectureSteps: [
      'Запрос пользователя',
      'Keyword Router',
      'Model Lane',
      'sqlglot Validation',
      'AST Safety',
      'Ответ из sandbox',
    ],
    architectureLanes: [
      'Reasoning / Math -> Grok 4',
      'Analytics -> GPT-4o-mini',
      'Standard -> Claude Sonnet',
      'sqlglot column-level validation',
      'AST visitor safety guard',
      'E2B sandbox execution',
    ],
    investorBullets: [
      'Мультиагентный стек с понятными продуктовыми поверхностями вместо одного универсального ассистента.',
      'Маршрутизация, валидация и HITL-checkpoints делают систему наблюдаемой по дизайну.',
      'Путь от developer tooling к операторским workflow-продуктам.',
    ],
  },
  he: {
    meta: {
      title: 'RomeoFlexVision | אקוסיסטם Agentic AI',
      description:
        'תזמור רב-סוכני עבור data science והפקת מדיה אוטומטית. Andrew Swarm, Romeo PhD, Bassito ו-PinoCut.',
      ogTitle: 'RomeoFlexVision | אקוסיסטם Agentic AI',
      ogDescription: 'תשתית תזמור AI עבור data science והפקת מדיה.',
    },
    nav: {
      ecosystem: 'אקוסיסטם',
      products: 'מוצרים',
      stack: 'Tech Stack',
      roadmap: 'Roadmap',
      contact: 'יצירת קשר',
      github: 'GitHub',
      telegram: 'Telegram',
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
      eyebrow: 'Agentic AI Ecosystem for Data Science and Media Production',
      title: 'בונים את האקוסיסטם הסוכני',
      subtitle:
        'תזמור רב-סוכני עבור data science והפקת מדיה על גבי ROMA, LangGraph ושכבת runtime הבאה של Moltis.',
      primaryCta: 'גלה את המוצרים',
      secondaryCta: 'צפה ב-GitHub',
      tertiaryCta: 'פתח פלטפורמה',
      orbitTitle: 'מפת התזמור של ROMA',
      orbitCaption:
        'שכבת תפעול אחת מתאמת אנליטיקה, למידה, הפקת וידאו אוטומטית ופוסט-פרודקשן מודולרי.',
    },
    sections: {
      ecosystem: 'אקוסיסטם אחד. ארבעה סוכנים. אינסוף אפשרויות.',
      ecosystemDescription:
        'עמוד הנחיתה הציבורי בנוי סביב control plane אחת: ROMA מנתב את העבודה והמוצרים הייעודיים מבצעים אותה.',
      products: 'מוצרים שנבנו לזרימות עבודה אמיתיות',
      productsDescription:
        'כל מוצר פותר תפקיד אחר, אבל המנוף האמיתי מגיע ממודל התזמור המשותף.',
      stack: 'Tech stack עבור orchestration, inference, data ו-media',
      stackDescription:
        'הסטאק בכוונה היברידי: תזמור חזק, גמישות מודלית ופרקטיות לכלי פיתוח ולאוטומציית מדיה.',
      architecture: 'איך Andrew Swarm מנתב עבודה טכנית',
      architectureDescription:
        'שאילתה עוברת ניתוב, בחירת lane, ולידציה ו-sandboxing עוד לפני שהיא הופכת לביצוע.',
      roadmap: 'Roadmap אל RomeoFlexVision v1.0',
      roadmapDescription:
        'מפת הדרך הציבורית מציגה את המעבר מיסודות orchestration אל runtime hardening ו-product positioning.',
      investors: 'למשקיעים ולשותפים אסטרטגיים',
      investorsDescription:
        'RomeoFlexVision מעוצב כאקוסיסטם מוצרי נראה וניתן לבדיקה, ולא כרעיון AI מופשט.',
      community: 'קהילה, גישה למוצר ומאגרים',
      communityDescription:
        'GitHub, Telegram ו-LinkedIn הם כרגע המשטחים הציבוריים המרכזיים שבהם האקוסיסטם מתועד ומופץ.',
      faq: 'FAQ למפתחים ולמקבלי החלטות',
      faqDescription:
        'FAQ טכני קצר למפתחים, שותפים וכל מי שמנסה להבין היכן האקוסיסטם עומד היום.',
    },
    labels: {
      centralNode: 'צומת מרכזי',
      sharedControlPlane: 'Control plane משותפת',
      sharedControlPlaneDescription:
        'ניתוב, ולידציה, לולאות review ונראות עלויות מטופלים כהתנהגות פלטפורמה ולא כסקריפטים מבודדים.',
      crossDomainExecution: 'ביצוע חוצה דומיינים',
      crossDomainExecutionDescription:
        'האקוסיסטם תומך ב-data science, הסבר לימודי, הפקת וידאו אוטומטית והרכבת סצנות מודולרית בתוך נרטיב אחד.',
      humanLoop: 'Human-in-the-loop',
      humanLoopDescription:
        'רמות הביטחון ושערי האיכות נשארים גלויים כדי שמפעיל יוכל להתערב לפני שה-workflow נסחף.',
      builtWith: 'נבנה עם Claude + LangGraph',
      footerSummary:
        'RomeoFlexVision הוא build log ציבורי ומשטח מוצר עבור orchestration סוכני בתחומי data science והפקת מדיה.',
      footerStack: 'FastAPI, TypeScript, React, FFmpeg וכלי AI בגישת developer-first.',
      rights: '(c) 2026 RomeoFlexVision. כל הזכויות שמורות.',
      investorCta: 'פתח Telegram',
      roadmapStep: 'שלב',
    },
    ecosystemCards: [
      {
        title: 'Control plane משותפת',
        description:
          'ניתוב, ולידציה, לולאות review ונראות FinOps חיים ברמת הפלטפורמה ולא בתוך כלים מבודדים.',
      },
      {
        title: 'ביצוע חוצה דומיינים',
        description:
          'אותו אקוסיסטם תומך ב-data science, הסבר חינוכי, אוטומציית וידאו והרכבת סצנות מובנית.',
      },
      {
        title: 'Human-in-the-loop review',
        description:
          'רמות הביטחון ובקרת האיכות נשארות גלויות כדי שמפעיל יוכל להתערב לפני שה-workflow סוטה.',
      },
    ],
    architectureSteps: [
      'שאילתת משתמש',
      'Keyword Router',
      'Model Lane',
      'sqlglot Validation',
      'AST Safety',
      'תגובה מה-sandbox',
    ],
    architectureLanes: [
      'Reasoning / Math -> Grok 4',
      'Analytics -> GPT-4o-mini',
      'Standard -> Claude Sonnet',
      'sqlglot column-level validation',
      'AST visitor safety guard',
      'E2B sandbox execution',
    ],
    investorBullets: [
      'סטאק רב-סוכני עם משטחי מוצר ברורים במקום עוזר כללי אחד.',
      'ניתוב, ולידציה ו-HITL checkpoints הופכים את המערכת לנראית וניתנת לבדיקה.',
      'מסלול מכלי פיתוח אל מוצרי workflow למפעילים.',
    ],
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
  };
}
