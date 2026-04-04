import type { Language } from '../context/LanguageContext';

export const SITE_LINKS = {
  github: 'https://github.com/aleksandrlyubarev-blip/RomeoFlexVision',
  telegram: 'https://t.me/RomeoFlexVision_bot',
  telegramHandle: '@RomeoFlexVision_bot',
  linkedin: 'https://www.linkedin.com/company/romeoflexvision',
  landing: 'https://romeoflexvision.com/',
  physicalAiDeck: '/downloads/RomeoFlexVision_Physical_AI.pdf',
  roboqcDeck: '/downloads/RoboQC_Precision_Assembly_AI.pdf',
  combinedDeck: '/downloads/RomeoFlexVision_RoboQC_Combined_Deck.pdf',
} as const;

export interface SiteMetaCopy {
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
}

export interface SiteNavCopy {
  products: string;
  problem: string;
  solution: string;
  traction: string;
  edge: string;
  cloud: string;
  roadmap: string;
  team: string;
  contact: string;
  deck: string;
  pilot: string;
  github: string;
  telegram: string;
  linkedin: string;
  menu: string;
  close: string;
}

export interface SiteHeroCopy {
  eyebrow: string;
  title: string;
  subtitle: string;
  sloganLabel: string;
  slogan: string;
  primaryCta: string;
  secondaryCta: string;
  tertiaryCta: string;
  chips: string[];
}

export interface SiteProduct {
  name: string;
  subtitle: string;
  description: string;
  bullets: string[];
}

export interface SiteProblemItem {
  title: string;
  description: string;
}

export interface SiteSolutionStep {
  step: string;
  title: string;
  description: string;
}

export interface SiteTractionStat {
  value: string;
  label: string;
}

export interface SiteRoadmapItem {
  phase: string;
  title: string;
  description: string;
}

export interface SiteDownloadItem {
  title: string;
  description: string;
  href: string;
}

export interface SiteContactMethod {
  title: string;
  description: string;
  href: string;
  action: string;
}

export interface SiteFormCopy {
  title: string;
  description: string;
  nameLabel: string;
  companyLabel: string;
  emailLabel: string;
  messageLabel: string;
  submitLabel: string;
  submittingLabel: string;
  helper: string;
  success: string;
  error: string;
}

export interface SiteUiCopy {
  partnersLabel: string;
  tractionNote: string;
  problemVisualLabel: string;
  solutionVisualLabel: string;
  teamBadge: string;
  downloadsLabel: string;
  contactLinksLabel: string;
  thinkPadLabel: string;
  thinkPadDescription: string;
}

export interface SiteCopy {
  meta: SiteMetaCopy;
  nav: SiteNavCopy;
  hero: SiteHeroCopy;
  heroVisual: {
    headline: string;
    subline: string;
    cardA: string;
    cardB: string;
    cardC: string;
  };
  products: {
    kicker: string;
    title: string;
    description: string;
    items: SiteProduct[];
  };
  problem: {
    kicker: string;
    title: string;
    description: string;
    items: SiteProblemItem[];
  };
  solution: {
    kicker: string;
    title: string;
    description: string;
    steps: SiteSolutionStep[];
    semanticTitle: string;
    semanticDescription: string;
  };
  traction: {
    kicker: string;
    title: string;
    description: string;
    stats: SiteTractionStat[];
  };
  edge: {
    kicker: string;
    title: string;
    description: string;
    bullets: string[];
    footer: string;
  };
  cloud: {
    kicker: string;
    title: string;
    description: string;
    bullets: string[];
  };
  roadmap: {
    kicker: string;
    title: string;
    description: string;
    items: SiteRoadmapItem[];
  };
  team: {
    kicker: string;
    title: string;
    description: string;
    leaderName: string;
    leaderRole: string;
    expertise: string[];
  };
  downloads: SiteDownloadItem[];
  contactMethods: SiteContactMethod[];
  form: SiteFormCopy;
  ui: SiteUiCopy;
}

const SITE_COPY: Record<Language, SiteCopy> = {
  en: {
    meta: {
      title: 'RomeoFlexVision | The Open Execution Layer for Physical AI',
      description:
        'RomeoFlexVision is the open execution layer for physical AI, and RoboQC brings that stack into AI-powered visual quality control for electronics assembly.',
      ogTitle: 'RomeoFlexVision | Open Execution Layer for Physical AI',
      ogDescription:
        'No CAD. No Cloud. No ML Team. Synchronized Physical Action with RoboQC for inline quality control.',
    },
    nav: {
      products: 'Products',
      problem: 'Problem',
      solution: 'Solution',
      traction: 'Traction',
      edge: 'Tech Edge',
      cloud: 'Google Cloud',
      roadmap: 'Roadmap',
      team: 'Team',
      contact: 'Contact',
      deck: 'Download Pitch Deck',
      pilot: 'Book a Pilot',
      github: 'GitHub',
      telegram: 'Telegram',
      linkedin: 'LinkedIn',
      menu: 'Menu',
      close: 'Close',
    },
    hero: {
      eyebrow: 'RomeoFlexVision',
      title: 'The Open Execution Layer for Physical AI',
      subtitle:
        'RoboQC brings that stack into AI-powered visual quality control for electronics assembly, catching defects inline instead of waiting for end-of-line failure.',
      sloganLabel: 'Core slogan',
      slogan:
        'No CAD. No Cloud. No ML Team. Synchronized Physical Action.',
      primaryCta: 'Download Pitch Deck',
      secondaryCta: 'Book a Pilot',
      tertiaryCta: 'Google Cloud Partnership',
      chips: ['Physical AI', 'Edge-native QC', 'Hebrew-ready site', 'Editable corporate landing'],
    },
    heroVisual: {
      headline: 'RoboQC + RomeoFlexVision',
      subline: 'A dark physical-AI surface built from the two pitch decks.',
      cardA: 'Inline visual quality control for electronics assembly',
      cardB: 'Neutral execution layer across heterogeneous hardware',
      cardC: 'Sub-200ms edge inference with few-shot deployment',
    },
    products: {
      kicker: 'Products',
      title: 'Two layers. One industrial story.',
      description:
        'RomeoFlexVision is the execution layer. RoboQC is the applied quality-control product that operators and factories feel first.',
      items: [
        {
          name: 'RomeoFlexVision',
          subtitle: 'Open Execution Layer for Physical AI',
          description:
            'The neutral bridge that coordinates perception, reasoning, and action across heterogeneous industrial hardware.',
          bullets: [
            'Import -> Annotate -> Train -> Deploy',
            'Built for on-prem, multi-vendor industrial execution',
            'Designed to avoid hardware deadlocks and vendor lock-in',
          ],
        },
        {
          name: 'RoboQC',
          subtitle: 'AI-Powered Visual Quality Control for Electronics Assembly',
          description:
            'The camera-first quality-control product that catches station-level defects before they become expensive end-of-line failures.',
          bullets: [
            'Catch the defect on station #2, not on test #5',
            'Visual proof with frame, trace, and operator decision support',
            'Edge-native inline QA for high-density electronics assembly',
          ],
        },
      ],
    },
    problem: {
      kicker: 'Problem',
      title: 'The factory floor is still split by coordination gaps and late discovery.',
      description:
        'The two decks describe the same industrial trap from different angles: closed ecosystems create hardware friction, while reactive QC makes every missed defect more expensive.',
      items: [
        {
          title: 'Coordination Gap',
          description:
            'Physical AI systems still break between perception and action, especially when multiple hardware nodes disagree about what is happening.',
        },
        {
          title: 'Proprietary Gravity Wells',
          description:
            'Closed vendor stacks lock factories into isolated hardware decisions instead of letting them coordinate the best available tools.',
        },
        {
          title: 'QC Cost Explosion',
          description:
            'A defect born on station #2 can be cheap to fix immediately, but expensive to rework when it is discovered only at station #5.',
        },
      ],
    },
    solution: {
      kicker: 'Solution',
      title: 'A deployment path from raw evidence to synchronized physical action.',
      description:
        'RomeoFlexVision provides the execution pattern, while RoboQC applies it to inline inspection, operator evidence, and physical escalation.',
      steps: [
        {
          step: '01',
          title: 'Import',
          description: 'Bring in production evidence, station context, and the first real defect scenarios.',
        },
        {
          step: '02',
          title: 'Annotate',
          description: 'Create operator-readable labels and visual ground truth without requiring a giant ML program.',
        },
        {
          step: '03',
          title: 'Train',
          description: 'Use few-shot learning and edge-ready models to reach useful detection quickly.',
        },
        {
          step: '04',
          title: 'Deploy',
          description: 'Run the model inline on the edge and trigger evidence-backed operator action.',
        },
      ],
      semanticTitle: 'Semantic Conflict Resolution',
      semanticDescription:
        'The action layer is not just a webhook. It is the final industrial verdict that resolves competing inputs and triggers the PLC or downstream physical move.',
    },
    traction: {
      kicker: 'Traction',
      title: 'The narrative is already moving from deck to factory conversations.',
      description:
        'The current traction story combines partner credibility, real investigations, and live-pilot timing for 2026.',
      stats: [
        { value: 'NVIDIA', label: 'Inception Partner' },
        { value: '5', label: 'Pilot factories' },
        { value: '100+', label: 'Investigations completed' },
        { value: 'Q2 2026', label: 'Pilots live' },
      ],
    },
    edge: {
      kicker: 'Tech Edge',
      title: 'A practical edge stack for dense industrial inspection.',
      description:
        'The RoboQC deck makes the deployment case clearly: real inline response requires low latency, on-prem execution, and fast startup without CAD dependencies.',
      bullets: [
        'Sub-200ms latency on an RTX 3060/4060 edge node',
        '100% edge-native and framed for fast Docker-based deployment',
        'No CAD requirement and few-shot learning from 10-30 golden samples',
        'PatchCore for anomaly detection plus Florence-2 VLM for semantic reasoning',
      ],
      footer:
        'Hardware density is exceeding human inspection capabilities, while edge AI cost/performance has finally unlocked real-time physical deployment.',
    },
    cloud: {
      kicker: 'Google Cloud',
      title: 'How Google Cloud can accelerate our growth',
      description:
        'This block is structured as a partnership narrative for the site: how cloud support helps the team move faster, stay visible, and prepare broader edge rollout.',
      bullets: [
        'Vertex AI for rapid experiment loops, model evaluation, and partner demos',
        'Google startup credits to shorten iteration cycles during the pilot phase',
        'GKE and edge-container deployment language for scalable industrial rollout',
        'Israel Cloud AI events and partner visibility to support business development',
      ],
    },
    roadmap: {
      kicker: 'Roadmap',
      title: 'A 12-week roadmap from pilot station to rollout plan.',
      description:
        'The site now needs a roadmap that feels credible to operators, partners, and sponsors: one station first, then evidence, then wider deployment.',
      items: [
        {
          phase: 'Weeks 1-3',
          title: 'Select the wedge and collect golden samples',
          description:
            'Lock the first pilot station, confirm the defect family, and gather the initial 10-30 golden samples.',
        },
        {
          phase: 'Weeks 4-6',
          title: 'Import, annotate, and benchmark edge inference',
          description:
            'Build the first labeled loop, validate the visual model, and confirm sub-200ms target behavior on the edge node.',
        },
        {
          phase: 'Weeks 7-9',
          title: 'Deploy RoboQC inline with operator evidence',
          description:
            'Run the system on the line, deliver frame-trace-decision evidence, and tune the escalation path for operators.',
        },
        {
          phase: 'Weeks 10-12',
          title: 'Prepare expansion and board-level narrative',
          description:
            'Package the KPI story, identify the next stations, and turn the pilot into a repeatable rollout plan for Q2 2026.',
        },
      ],
    },
    team: {
      kicker: 'Team',
      title: 'Built by operators of the problem, not only observers of the market.',
      description:
        'The founder card is intentionally lean here because the repository does not include a verified portrait asset. The focus stays on expertise and execution credibility.',
      leaderName: 'Alexander Lyubarev',
      leaderRole: 'Founder, RomeoFlexVision / RoboQC',
      expertise: [
        'Physical AI execution layers and industrial coordination logic',
        'Inline quality control for dense electronics and server-rack assembly',
        'Edge-native deployment, product strategy, and technical storytelling',
      ],
    },
    downloads: [
      {
        title: 'Combined Pitch Deck',
        description:
          'Merged deck for fast partner conversations, investor intros, and customer walkthroughs.',
        href: SITE_LINKS.combinedDeck,
      },
      {
        title: 'RomeoFlexVision Physical AI Deck',
        description:
          'Execution-layer narrative, coordination gap, neutral bridge, and defensibility matrix.',
        href: SITE_LINKS.physicalAiDeck,
      },
      {
        title: 'RoboQC Precision Assembly AI Deck',
        description:
          'Inline QC story, cost-to-rework logic, edge stack, wedge market, and rollout narrative.',
        href: SITE_LINKS.roboqcDeck,
      },
    ],
    contactMethods: [
      {
        title: 'Telegram Bot',
        description: 'Fastest route for pilot intros, product questions, and live follow-up.',
        href: SITE_LINKS.telegram,
        action: 'Open bot',
      },
      {
        title: 'GitHub',
        description: 'Repository, deployment history, and the public build surface for the site.',
        href: SITE_LINKS.github,
        action: 'Open repository',
      },
      {
        title: 'LinkedIn',
        description: 'Company narrative, partnership framing, and external visibility.',
        href: SITE_LINKS.linkedin,
        action: 'Open LinkedIn',
      },
    ],
    form: {
      title: "Write me & let's inspire!",
      description:
        'Send your pilot brief into the RoboQC inbox and open Telegram in parallel, so the team gets a real lead and you get an immediate operator route.',
      nameLabel: 'Name',
      companyLabel: 'Company',
      emailLabel: 'Email',
      messageLabel: 'What do you want to inspect?',
      submitLabel: 'Send brief and open Telegram',
      submittingLabel: 'Sending brief...',
      helper: 'We send this request to the pilot inbox and open the bot in a new tab.',
      success: 'Lead sent to the pilot inbox. Telegram is open in a new tab.',
      error: 'Lead was not delivered to the pilot inbox. Telegram opened as a fallback.',
    },
    ui: {
      partnersLabel: 'Partners and signals',
      tractionNote: '"Physical AI is the next frontier."',
      problemVisualLabel: 'Cost explosion in reactive QC',
      solutionVisualLabel: 'Execution layer from import to action',
      teamBadge: 'Founder card',
      downloadsLabel: 'Downloads',
      contactLinksLabel: 'Public routes',
      thinkPadLabel: 'ThinkPad milestone',
      thinkPadDescription:
        'Portable demo kit for meetings, events, and fast pilot storytelling outside the factory floor.',
    },
  },
  he: {
    meta: {
      title: 'RomeoFlexVision | שכבת הביצוע הפתוחה ל-Physical AI',
      description:
        'RomeoFlexVision היא שכבת הביצוע הפתוחה ל-Physical AI, ו-RoboQC מביאה את הסטאק הזה לבקרת איכות חזותית בזמן אמת עבור הרכבת אלקטרוניקה.',
      ogTitle: 'RomeoFlexVision | שכבת הביצוע הפתוחה ל-Physical AI',
      ogDescription:
        'בלי CAD. בלי ענן. בלי צוות ML. פעולה פיזית מסונכרנת עם RoboQC לבקרת איכות inline.',
    },
    nav: {
      products: 'מוצרים',
      problem: 'בעיה',
      solution: 'פתרון',
      traction: 'טרקשן',
      edge: 'יתרון טכני',
      cloud: 'Google Cloud',
      roadmap: 'מפת דרך',
      team: 'צוות',
      contact: 'יצירת קשר',
      deck: 'הורדת דק',
      pilot: 'לתאם פיילוט',
      github: 'GitHub',
      telegram: 'Telegram',
      linkedin: 'LinkedIn',
      menu: 'תפריט',
      close: 'סגור',
    },
    hero: {
      eyebrow: 'RomeoFlexVision',
      title: 'שכבת הביצוע הפתוחה ל-Physical AI',
      subtitle:
        'RoboQC מביאה את הסטאק הזה לבקרת איכות חזותית עבור הרכבת אלקטרוניקה, ותופסת פגמים inline במקום להמתין לכשל בקצה הקו.',
      sloganLabel: 'סלוגן',
      slogan: 'בלי CAD. בלי ענן. בלי צוות ML. פעולה פיזית מסונכרנת.',
      primaryCta: 'הורדת דק',
      secondaryCta: 'לתאם פיילוט',
      tertiaryCta: 'שותפות Google Cloud',
      chips: ['Physical AI', 'QC קצה', 'אתר באנגלית + עברית', 'לנדינג תאגידי עריך'],
    },
    heroVisual: {
      headline: 'RoboQC + RomeoFlexVision',
      subline: 'משטח פיזיקלי-טכנולוגי כהה שנבנה משני הדקים שסופקו.',
      cardA: 'בקרת איכות חזותית inline להרכבת אלקטרוניקה',
      cardB: 'שכבת ביצוע ניטרלית על חומרה הטרוגנית',
      cardC: 'אינפרנס קצה תת-200ms עם Few-shot deployment',
    },
    products: {
      kicker: 'מוצרים',
      title: 'שתי שכבות. סיפור תעשייתי אחד.',
      description:
        'RomeoFlexVision היא שכבת הביצוע. RoboQC היא שכבת המוצר היישומית שמרגישים קודם בקו ובמפעל.',
      items: [
        {
          name: 'RomeoFlexVision',
          subtitle: 'שכבת ביצוע פתוחה ל-Physical AI',
          description:
            'הגשר הניטרלי שמתאם בין תפיסה, reasoning ופעולה על גבי חומרה תעשייתית הטרוגנית.',
          bullets: [
            'Import -> Annotate -> Train -> Deploy',
            'מותאם ל-on-prem ולביצוע תעשייתי רב-ספקי',
            'נועד למנוע deadlocks של חומרה ונעילה אצל ספק יחיד',
          ],
        },
        {
          name: 'RoboQC',
          subtitle: 'בקרת איכות חזותית מבוססת AI להרכבת אלקטרוניקה',
          description:
            'מוצר QC מבוסס מצלמה שתופס פגמי תחנה לפני שהם הופכים לכשל יקר בסוף הקו.',
          bullets: [
            'לתפוס את הפגם בתחנה 2, לא רק בבדיקה 5',
            'הוכחה חזותית עם frame, trace ותמיכה בקבלת החלטה למפעיל',
            'בקרת איכות inline ו-edge-native לסביבות אלקטרוניקה צפופות',
          ],
        },
      ],
    },
    problem: {
      kicker: 'בעיה',
      title: 'רצפת הייצור עדיין נשברת על פערי תיאום וגילוי מאוחר.',
      description:
        'שני הדקים מתארים את אותה מלכודת תעשייתית משתי זוויות: אקוסיסטמות סגורות יוצרות חיכוך חומרה, ו-QC תגובתי מייקר כל פגם שמפספסים.',
      items: [
        {
          title: 'פער תיאום',
          description:
            'מערכות Physical AI עדיין נתקעות בין תפיסה לפעולה, במיוחד כאשר כמה nodes לא מסכימים על מה קורה בפועל.',
        },
        {
          title: 'בורות כבידה קנייניים',
          description:
            'סטאקים סגורים נועלים את המפעל להחלטות חומרה מבודדות במקום לאפשר תיאום בין הכלים הטובים ביותר.',
        },
        {
          title: 'פיצוץ עלויות ב-QC',
          description:
            'פגם שנולד בתחנה 2 יכול להיות זול לתיקון מיד, אבל יקר מאוד לעיבוד חוזר אם מתגלה רק בתחנה 5.',
        },
      ],
    },
    solution: {
      kicker: 'פתרון',
      title: 'מסלול הטמעה מראיה גולמית עד פעולה פיזית מסונכרנת.',
      description:
        'RomeoFlexVision מספקת את דפוס הביצוע, ו-RoboQC מיישמת אותו לבדיקת inline, הוכחה למפעיל והסלמה פיזית.',
      steps: [
        {
          step: '01',
          title: 'Import',
          description: 'מביאים evidence ייצור, הקשר תחנה ותרחישי פגם ראשונים מהעולם האמיתי.',
        },
        {
          step: '02',
          title: 'Annotate',
          description: 'יוצרים תיוגים קריאים למפעיל ו-ground truth חזותי בלי לבנות תוכנית ML ענקית.',
        },
        {
          step: '03',
          title: 'Train',
          description: 'משתמשים ב-few-shot learning ובמודלים מוכנים ל-edge כדי להגיע מהר לזיהוי שימושי.',
        },
        {
          step: '04',
          title: 'Deploy',
          description: 'מריצים את המודל inline על ה-edge ומפעילים פעולה מבוססת evidence לקו.',
        },
      ],
      semanticTitle: 'Semantic Conflict Resolution',
      semanticDescription:
        'שכבת הפעולה איננה רק webhook. זו ההכרעה התעשייתית הסופית שפותרת קלטים סותרים ומפעילה את ה-PLC או את המהלך הפיזי הבא.',
    },
    traction: {
      kicker: 'טרקשן',
      title: 'הנרטיב כבר נע מדק לשיחות אמיתיות עם מפעלים.',
      description:
        'סיפור הטרקשן הנוכחי משלב אמינות שותפים, חקירות שבוצעו בפועל, ותזמון פיילוטים חיים ל-2026.',
      stats: [
        { value: 'NVIDIA', label: 'שותף Inception' },
        { value: '5', label: 'מפעלי פיילוט' },
        { value: '100+', label: 'חקירות הושלמו' },
        { value: 'Q2 2026', label: 'פיילוטים חיים' },
      ],
    },
    edge: {
      kicker: 'יתרון טכני',
      title: 'סטאק קצה פרקטי לבדיקת תעשייה צפופה.',
      description:
        'הדק של RoboQC מציג את המקרה בצורה ברורה: תגובת inline אמיתית דורשת latency נמוך, ביצוע on-prem והתחלה מהירה בלי תלות ב-CAD.',
      bullets: [
        'Latency תת-200ms על edge node מסוג RTX 3060/4060',
        '100% edge-native וממוסגר להטמעת Docker מהירה',
        'ללא צורך ב-CAD ועם few-shot learning מ-10-30 golden samples',
        'PatchCore לזיהוי אנומליות יחד עם Florence-2 VLM להבנה סמנטית',
      ],
      footer:
        'צפיפות החומרה כבר עולה על יכולת הבדיקה האנושית, ויחס העלות-ביצועים של edge AI פתח סוף סוף פריסה פיזית בזמן אמת.',
    },
    cloud: {
      kicker: 'Google Cloud',
      title: 'איך Google Cloud יכולה להאיץ את הצמיחה שלנו',
      description:
        'הבלוק הזה מוצג באתר כנרטיב שותפות: איך תמיכת cloud עוזרת לצוות לזוז מהר יותר, להישאר גלוי, ולהכין rollout רחב יותר ל-edge.',
      bullets: [
        'Vertex AI ללולאות ניסוי מהירות, הערכת מודלים ודמואים לשותפים',
        'קרדיטים לסטארטאפים כדי לקצר את קצב האיטרציה בשלב הפיילוט',
        'שפת GKE ו-edge containers עבור rollout תעשייתי בקנה מידה',
        'אירועי Israel Cloud AI ונראות שותפים לצורך business development',
      ],
    },
    roadmap: {
      kicker: 'מפת דרך',
      title: 'מפת דרך של 12 שבועות מתחנת פיילוט עד תוכנית rollout.',
      description:
        'מפת הדרך צריכה להישמע אמינה למפעילים, לשותפים ולספונסרים: תחנה אחת קודם, אחר כך evidence, ואז פריסה רחבה יותר.',
      items: [
        {
          phase: 'שבועות 1-3',
          title: 'בחירת ה-wedge ואיסוף golden samples',
          description:
            'נועלים תחנת פיילוט ראשונה, מאשרים משפחת פגמים, ואוספים את 10-30 הדוגמאות הראשונות.',
        },
        {
          phase: 'שבועות 4-6',
          title: 'Import, annotate ו-benchmark לקצה',
          description:
            'בונים לולאת labeling ראשונה, מאמתים את המודל החזותי, ומוודאים התנהגות תת-200ms על edge node.',
        },
        {
          phase: 'שבועות 7-9',
          title: 'פריסת RoboQC inline עם evidence למפעיל',
          description:
            'מריצים את המערכת על הקו, מספקים evidence מסוג frame-trace-decision, ומכוונים את מסלול ההסלמה.',
        },
        {
          phase: 'שבועות 10-12',
          title: 'הכנת הרחבה ונרטיב ברמת הנהלה',
          description:
            'אורזים את סיפור ה-KPI, מזהים את התחנות הבאות, והופכים את הפיילוט לתוכנית rollout שניתנת לשכפול ל-Q2 2026.',
        },
      ],
    },
    team: {
      kicker: 'צוות',
      title: 'נבנה על ידי מי שמפעילים את הבעיה, לא רק מתבוננים בה.',
      description:
        'כרטיס המייסד נשאר כאן רזה בכוונה כי בריפו אין כרגע פורטרט מאומת. המיקוד נשאר במומחיות ובאמינות הביצוע.',
      leaderName: 'Alexander Lyubarev',
      leaderRole: 'Founder, RomeoFlexVision / RoboQC',
      expertise: [
        'שכבות ביצוע ל-Physical AI ולוגיקת תיאום תעשייתית',
        'בקרת איכות inline להרכבת אלקטרוניקה צפופה ו-server racks',
        'פריסת edge-native, אסטרטגיית מוצר וסטוריטלינג טכני',
      ],
    },
    downloads: [
      {
        title: 'דק משולב',
        description:
          'דק מאוחד לשיחות שותפים, אינטרואים למשקיעים והליכה מהירה על הסיפור המלא.',
        href: SITE_LINKS.combinedDeck,
      },
      {
        title: 'RomeoFlexVision Physical AI Deck',
        description:
          'נרטיב שכבת הביצוע, פער התיאום, ה-neutral bridge ומטריצת ההגנה הארכיטקטונית.',
        href: SITE_LINKS.physicalAiDeck,
      },
      {
        title: 'RoboQC Precision Assembly AI Deck',
        description:
          'סיפור ה-inline QC, לוגיקת עלות לתיקון, סטאק ה-edge, ה-wedge market ונרטיב rollout.',
        href: SITE_LINKS.roboqcDeck,
      },
    ],
    contactMethods: [
      {
        title: 'Telegram Bot',
        description: 'הנתיב המהיר ביותר לפיילוט, שאלות מוצר ומעקב חי.',
        href: SITE_LINKS.telegram,
        action: 'פתיחת הבוט',
      },
      {
        title: 'GitHub',
        description: 'הריפו, היסטוריית הדיפלוי ומשטח הבנייה הציבורי של האתר.',
        href: SITE_LINKS.github,
        action: 'פתיחת הריפו',
      },
      {
        title: 'LinkedIn',
        description: 'נרטיב החברה, שותפויות ונראות חיצונית.',
        href: SITE_LINKS.linkedin,
        action: 'פתיחת LinkedIn',
      },
    ],
    form: {
      title: 'Write me & let’s inspire!',
      description:
        'שלח את הבריף שלך ישירות ל-inbox של RoboQC ובמקביל פתח את Telegram, כך שהצוות מקבל ליד אמיתי ואתה מקבל ערוץ מהיר לשיחה.',
      nameLabel: 'שם',
      companyLabel: 'חברה',
      emailLabel: 'אימייל',
      messageLabel: 'מה תרצה לבדוק?',
      submitLabel: 'לשלוח בריף ולפתוח Telegram',
      submittingLabel: 'שולח בריף...',
      helper: 'אנחנו שולחים את הבקשה ל-inbox של הפיילוט ופותחים את הבוט בלשונית חדשה.',
      success: 'הליד נשלח ל-inbox של הפיילוט. Telegram פתוח בלשונית חדשה.',
      error: 'הליד לא נמסר ל-inbox של הפיילוט. Telegram נפתח כנתיב גיבוי.',
    },
    ui: {
      partnersLabel: 'שותפים וסיגנלים',
      tractionNote: '"Physical AI is the next frontier."',
      problemVisualLabel: 'פיצוץ עלויות ב-QC תגובתי',
      solutionVisualLabel: 'שכבת ביצוע מ-import עד action',
      teamBadge: 'כרטיס מייסד',
      downloadsLabel: 'הורדות',
      contactLinksLabel: 'נתיבים ציבוריים',
      thinkPadLabel: 'ThinkPad milestone',
      thinkPadDescription:
        'ערכת דמו ניידת לפגישות, אירועים וסטוריטלינג מהיר של הפיילוט מחוץ לרצפת הייצור.',
    },
  },
};

export function getSiteContent(language: Language): SiteCopy {
  return SITE_COPY[language] ?? SITE_COPY.en;
}
