import type { Agent } from '../types';
import type { Language } from '../context/LanguageContext';

type LocalizedText = Record<Language, string>;

interface LocalizedAgent {
  id: Agent['id'];
  name: string;
  subtitle: LocalizedText;
  category: Agent['category'];
  status: Agent['status'];
  description: LocalizedText;
  subAgents: number;
  dataSources: Record<Language, string[]>;
  limitations: Record<Language, string[]>;
  icon: string;
  color: string;
}

const AGENT_SOURCE: LocalizedAgent[] = [
  {
    id: 'robo-qc',
    name: 'Robo QC',
    subtitle: { en: 'Quality Control', ru: 'Контроль качества', he: 'בקרת איכות' },
    category: 'analytic',
    status: 'ready',
    description: {
      en: 'Computer vision for production-line quality control and real-time defect detection.',
      ru: 'Компьютерное зрение и автоматический контроль качества продукции на производственной линии. Детектирует дефекты в реальном времени.',
      he: 'ראייה ממוחשבת לבקרת איכות על קו הייצור ולזיהוי פגמים בזמן אמת.',
    },
    subAgents: 4,
    dataSources: {
      en: ['Line cameras A1–A8', 'Defect database', 'CAD drawings', 'SCADA system'],
      ru: ['Камеры линии A1–A8', 'БД дефектов', 'CAD-чертежи', 'SCADA-система'],
      he: ['מצלמות קו A1–A8', 'מסד נתוני פגמים', 'שרטוטי CAD', 'מערכת SCADA'],
    },
    limitations: {
      en: ['94% accuracy above 300 lux', 'Defect size >0.5 mm', 'Degrades above 70% dust'],
      ru: ['Точность 94% при освещённости >300 лк', 'Размер дефекта >0.5мм', 'Не работает при запылённости >70%'],
      he: ['דיוק 94% מעל 300 לוקס', 'גודל פגם מעל 0.5 מ״מ', 'לא עובד היטב מעל 70% אבק'],
    },
    icon: 'bird',
    color: '#7aa2f7',
  },
  {
    id: 'romeo-phd',
    name: 'Romeo PhD',
    subtitle: { en: 'Research Analyst', ru: 'Научный аналитик', he: 'אנליסט מחקר' },
    category: 'analytic',
    status: 'ready',
    description: {
      en: 'Analyzes technical documentation, patents, and scientific papers to produce structured reports.',
      ru: 'Анализ технической документации, патентных баз и научных статей. Генерирует отчёты и цепочки рассуждений.',
      he: 'מנתח מסמכים טכניים, פטנטים ומאמרים מדעיים ומפיק דוחות מובנים.',
    },
    subAgents: 3,
    dataSources: {
      en: ['Arxiv', 'Google Scholar', 'Internal knowledge base', 'ISO standards'],
      ru: ['Arxiv', 'Google Scholar', 'Внутренняя база знаний', 'ISO-стандарты'],
      he: ['Arxiv', 'Google Scholar', 'מאגר ידע פנימי', 'תקני ISO'],
    },
    limitations: {
      en: ['Knowledge current through 2025-08', 'Does not verify experimental lab data'],
      ru: ['Данные актуальны до 2025-08', 'Не верифицирует экспериментальные данные'],
      he: ['הידע מעודכן עד 2025-08', 'לא מאמת נתוני מעבדה ניסיוניים'],
    },
    icon: 'cat',
    color: '#9d7cd8',
  },
  {
    id: 'andrew-analytic',
    name: 'Andrew Analytic',
    subtitle: { en: 'Data Analyst', ru: 'Аналитик данных', he: 'אנליסט נתונים' },
    category: 'analytic',
    status: 'computing',
    description: {
      en: 'Time-series analysis, anomaly detection, and predictive maintenance for industrial systems.',
      ru: 'Обработка временных рядов, прогнозирование отказов оборудования (PdM), аномалий и производственных трендов.',
      he: 'אנליזת סדרות זמן, זיהוי אנומליות ותחזוקה חזויה למערכות תעשייתיות.',
    },
    subAgents: 5,
    dataSources: {
      en: ['ClickHouse', 'InfluxDB', 'SAP ERP', 'IoT sensors'],
      ru: ['ClickHouse', 'InfluxDB', 'SAP ERP', 'IoT-сенсоры'],
      he: ['ClickHouse', 'InfluxDB', 'SAP ERP', 'חיישני IoT'],
    },
    limitations: {
      en: ['Forecast horizon up to 72 hours', 'Needs at least 30 days of history'],
      ru: ['Прогноз до 72 часов', 'Требует >30 дней исторических данных'],
      he: ['תחזית עד 72 שעות', 'דורש לפחות 30 ימי היסטוריה'],
    },
    icon: 'dog',
    color: '#73daca',
  },
  {
    id: 'bassito-animator',
    name: 'Bassito Animator',
    subtitle: { en: 'Animator', ru: 'Аниматор', he: 'אנימטור' },
    category: 'creative',
    status: 'ready',
    description: {
      en: 'Creates instructional animations, industrial visualizations, and presentation assets.',
      ru: 'Создание обучающих анимаций, визуализаций производственных процессов и интерактивных презентаций.',
      he: 'יוצר אנימציות הדרכה, ויזואליזציות תעשייתיות ונכסי מצגת.',
    },
    subAgents: 2,
    dataSources: {
      en: ['Asset library', 'Prompt templates', 'Brand kit'],
      ru: ['Asset-библиотека', 'Промпт-шаблоны', 'Brand-kit'],
      he: ['ספריית נכסים', 'תבניות פרומפט', 'ערכת מותג'],
    },
    limitations: {
      en: ['Output: MP4/WebM up to 4K', 'Up to 5 minutes per session'],
      ru: ['Выход: MP4/WebM до 4K', 'Длительность до 5 минут за сессию'],
      he: ['פלט: MP4/WebM עד 4K', 'עד 5 דקות לכל סשן'],
    },
    icon: 'rabbit',
    color: '#ff9e64',
  },
  {
    id: 'chertejnik',
    name: 'Chertejnik',
    subtitle: { en: 'Technical Draftsman', ru: 'Технический чертёжник', he: 'שרטט טכני' },
    category: 'creative',
    status: 'dev',
    description: {
      en: 'Generates technical drawings, schematics, and CAD documentation from text or sketches.',
      ru: 'Генерация технических чертежей, схем и CAD-документации по текстовым описаниям или эскизам.',
      he: 'מפיק שרטוטים טכניים, סכמות ומסמכי CAD מתיאור טקסטואלי או סקיצה.',
    },
    subAgents: 2,
    dataSources: {
      en: ['GOST library', 'Parts catalog', 'DXF/STEP templates'],
      ru: ['ГОСТ-библиотека', 'Каталог деталей', 'DXF/STEP шаблоны'],
      he: ['ספריית GOST', 'קטלוג חלקים', 'תבניות DXF/STEP'],
    },
    limitations: {
      en: ['No SOLIDWORKS export yet', 'Tolerance ±0.1 mm'],
      ru: ['В разработке: нет экспорта в SOLIDWORKS', 'Точность ±0.1мм'],
      he: ['עדיין ללא ייצוא ל-SOLIDWORKS', 'דיוק ±0.1 מ״מ'],
    },
    icon: 'turtle',
    color: '#e0af68',
  },
  {
    id: 'perevodchik',
    name: 'Translator',
    subtitle: { en: 'Technical Translator', ru: 'Технический переводчик', he: 'מתרגם טכני' },
    category: 'creative',
    status: 'ready',
    description: {
      en: 'Translates technical documentation, standards, and instructions while preserving structure.',
      ru: 'Синхронный перевод технической документации, стандартов и инструкций с сохранением форматирования.',
      he: 'מתרגם תיעוד טכני, תקנים והוראות תוך שמירה על מבנה ועיצוב.',
    },
    subAgents: 1,
    dataSources: {
      en: ['Technical glossary', 'Translation memory', 'ISO terminology'],
      ru: ['Технический глоссарий', 'Memoria TM', 'ISO-терминология'],
      he: ['מילון מונחים טכני', 'Translation memory', 'מונחי ISO'],
    },
    limitations: {
      en: ['25 languages', 'Specialized in manufacturing, electronics, chemistry'],
      ru: ['25 языков', 'Специализация: машиностроение, электроника, химия'],
      he: ['25 שפות', 'התמחות בייצור, אלקטרוניקה וכימיה'],
    },
    icon: 'fish',
    color: '#b4f9f8',
  },
  {
    id: 'pino-cut',
    name: 'Pino Cut',
    subtitle: { en: 'Video Editor', ru: 'Видеоредактор', he: 'עורך וידאו' },
    category: 'creative',
    status: 'dev',
    description: {
      en: 'Automates training and promo video assembly, cuts pauses, adds subtitles, transitions, and voiceover.',
      ru: 'Автоматический монтаж обучающих и промо-видео из исходных материалов. Вырезает паузы, расставляет субтитры, добавляет переходы и VO-дорожку.',
      he: 'עורך אוטומטית וידאו הדרכה וקידום, מסיר הפסקות ומוסיף כתוביות, מעברים וקריינות.',
    },
    subAgents: 3,
    dataSources: {
      en: ['Media storage', 'Transition library', 'Bassito asset library', 'TTS engine'],
      ru: ['Медиа-хранилище', 'Библиотека переходов', 'Asset-библиотека Bassito', 'TTS-движок Озвучки'],
      he: ['אחסון מדיה', 'ספריית מעברים', 'ספריית נכסים של Bassito', 'מנוע TTS'],
    },
    limitations: {
      en: ['No Adobe Premiere export yet', 'Up to 30 minutes of source media per session', 'Codecs: H.264, H.265, VP9'],
      ru: ['В разработке: нет экспорта для Adobe Premiere', 'Максимум 30 мин исходника за сессию', 'Поддержка кодеков: H.264, H.265, VP9'],
      he: ['עדיין ללא ייצוא ל-Adobe Premiere', 'עד 30 דקות חומר מקור לכל סשן', 'קודקים: H.264, H.265, VP9'],
    },
    icon: 'squirrel',
    color: '#f7768e',
  },
  {
    id: 'orchestrator',
    name: 'OrchestratorCore',
    subtitle: { en: 'Orchestrator', ru: 'Оркестратор', he: 'מתזמר' },
    category: 'orchestrator',
    status: 'ready',
    description: {
      en: 'The central router decomposes complex requests and routes sub-tasks to specialist agents.',
      ru: 'Центральный маршрутизатор задач. Декомпозирует сложные запросы и распределяет подзадачи между специализированными агентами.',
      he: 'הנתב המרכזי מפרק בקשות מורכבות ומפזר תתי-משימות בין סוכנים מתמחים.',
    },
    subAgents: 0,
    dataSources: {
      en: ['Agent registry', 'Task queue', 'Context window'],
      ru: ['Реестр агентов', 'Очередь задач', 'Context Window'],
      he: ['רשימת סוכנים', 'תור משימות', 'חלון הקשר'],
    },
    limitations: {
      en: ['Human-in-the-loop when uncertainty exceeds 40%'],
      ru: ['Human-in-the-loop при неопределённости >40%'],
      he: ['Human-in-the-loop כאשר אי-הוודאות גבוהה מ-40%'],
    },
    icon: 'shell',
    color: '#7aa2f7',
  },
];

export function getAgents(language: Language): Agent[] {
  return AGENT_SOURCE.map((agent) => ({
    id: agent.id,
    name: agent.name,
    nameRu: agent.subtitle[language],
    category: agent.category,
    status: agent.status,
    description: agent.description[language],
    subAgents: agent.subAgents,
    dataSources: agent.dataSources[language],
    limitations: agent.limitations[language],
    icon: agent.icon,
    color: agent.color,
  }));
}
