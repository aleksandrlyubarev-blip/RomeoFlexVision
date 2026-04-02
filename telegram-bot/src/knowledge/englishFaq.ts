import type { AppConfig } from '../config.js';

interface EnglishFaqEntry {
  id: string;
  groups: readonly (readonly string[])[];
  answer: (config: AppConfig) => string;
}

export interface KnowledgeReply {
  id: string;
  text: string;
}

const SUGGESTED_QUESTIONS = [
  'What is RoboQC?',
  'Why do you focus on station #2 instead of station #5?',
  'Do I need CAD, cloud, or an ML team?',
  'How many samples do I need to start?',
  'What is Romeo FlexVision?',
  'How fast is inference on the edge?',
] as const;

const ENGLISH_FAQ: readonly EnglishFaqEntry[] = [
  {
    id: 'roboqc-overview',
    groups: [
      ['what is', 'roboqc'],
      ['tell me about', 'roboqc'],
      ['what does', 'roboqc'],
      ['roboqc', 'quality control'],
    ],
    answer: (config) =>
      [
        'RoboQC is an AI-powered visual quality-control system for electronics assembly.',
        '',
        'It watches the line inline, catches defects the moment they are created, and sends evidence early enough for operators to act before the problem reaches end-of-line test.',
        '',
        `Public landing: ${config.links.site}`,
      ].join('\n'),
  },
  {
    id: 'station-two-vs-station-five',
    groups: [
      ['station 2', 'station 5'],
      ['station #2', 'station #5'],
      ['cost to rework'],
      ['reactive', 'qc'],
      ['rework', 'station 5'],
      ['missing screw'],
      ['misaligned connector'],
    ],
    answer: () =>
      [
        'The RoboQC thesis is simple: catch the defect at station #2, not at station #5.',
        '',
        'In the deck, a missing screw or misaligned connector is roughly a $10 fix when it is born at station #2, but it can become about $1,000 of rework if it escapes to end-of-line test.',
        '',
        'That is why RoboQC is built for inline prevention instead of reactive QA.',
      ].join('\n'),
  },
  {
    id: 'how-roboqc-works',
    groups: [
      ['how does', 'roboqc'],
      ['how', 'roboqc', 'work'],
      ['inline prevention'],
      ['edge native'],
      ['defect detected'],
      ['camera', 'station 2'],
    ],
    answer: () =>
      [
        'RoboQC places vision at the station where the defect is likely to appear, not only at the end of the line.',
        '',
        'A camera observes the process, the edge node detects the defect in real time, and the operator gets a frame, trace, and decision while the unit is still recoverable.',
        '',
        'The goal is evidence-first action, not a late spreadsheet after the shift is over.',
      ].join('\n'),
  },
  {
    id: 'no-cad-no-cloud',
    groups: [
      ['no cad'],
      ['need cad'],
      ['need cloud'],
      ['no cloud'],
      ['ml team'],
      ['need an ml team'],
      ['on prem'],
      ['on premise'],
      ['on prem capability'],
    ],
    answer: () =>
      [
        'RoboQC is designed to remove adoption friction on the factory floor.',
        '',
        'The positioning in the materials is: no CAD, no cloud, and no dedicated ML team required for the initial deployment.',
        '',
        'It is meant to run on-prem on an edge node so a plant can start with real inspection instead of a long infrastructure program.',
      ].join('\n'),
  },
  {
    id: 'samples-and-training',
    groups: [
      ['how many', 'samples'],
      ['golden samples'],
      ['few shot'],
      ['training samples'],
      ['how much data'],
      ['10 30'],
    ],
    answer: () =>
      [
        'The current product story is few-shot deployment rather than giant dataset collection.',
        '',
        'The deck points to roughly 10 to 30 golden samples to get started, using the way human inspectors learn what "good" looks like in the real world.',
        '',
        'That is positioned as an alternative to waiting for complex CAD-driven setup.',
      ].join('\n'),
  },
  {
    id: 'latency-and-hardware',
    groups: [
      ['latency'],
      ['inference'],
      ['200ms'],
      ['edge node'],
      ['rtx 3060'],
      ['rtx 4060'],
      ['hardware'],
      ['tensorrt'],
    ],
    answer: () =>
      [
        'The reference deployment in the deck uses an RTX 3060 or 4060 edge node.',
        '',
        'With TensorRT and 4-bit quantization, the target is sub-200ms inference, which is the range needed for real inline intervention instead of post-process reporting.',
      ].join('\n'),
  },
  {
    id: 'romeoflexvision-overview',
    groups: [
      ['what is', 'romeoflexvision'],
      ['what is', 'romeo flexvision'],
      ['romeo flexvision'],
      ['romeoflexvision'],
      ['open execution layer'],
      ['physical ai'],
    ],
    answer: () =>
      [
        'Romeo FlexVision is the open execution layer behind RoboQC.',
        '',
        'Its role is to bridge perception, reasoning, and physical action across heterogeneous industrial hardware, without locking the plant into a closed vendor stack.',
        '',
        'In the materials, it is positioned as the neutral bridge for physical AI: import, annotate, train, deploy, and then trigger real action on the floor.',
      ].join('\n'),
  },
  {
    id: 'semantic-conflict-resolution',
    groups: [
      ['semantic conflict'],
      ['action layer'],
      ['plc'],
      ['webhook'],
      ['physical move'],
      ['conflict resolution'],
    ],
    answer: () =>
      [
        'The action layer is about turning perception into a safe physical decision.',
        '',
        'In the RoboQC deck, semantic conflict resolution combines inputs from different nodes, resolves the final verdict, and then triggers the PLC or downstream control path.',
        '',
        'The point is that execution is not "just a webhook" - it is the verdict that causes the physical move.',
      ].join('\n'),
  },
  {
    id: 'open-source-and-vendor-lock',
    groups: [
      ['open source'],
      ['vendor lock'],
      ['lock in'],
      ['multi vendor'],
      ['neutral switzerland'],
      ['moat'],
      ['walled gardens'],
    ],
    answer: () =>
      [
        'Romeo FlexVision is positioned around an open-source core and multi-vendor coordination.',
        '',
        'The strategic argument is that factories do not want a black-box controller sitting in front of a multi-million-dollar line.',
        '',
        'By keeping the core open and hardware-neutral, the platform aims to reduce vendor lock-in and become the trusted routing layer between vision, PLCs, robotic arms, and third-party AMRs.',
      ].join('\n'),
  },
  {
    id: 'industries-and-pilot',
    groups: [
      ['pilot'],
      ['q2 pilot'],
      ['use cases'],
      ['industries'],
      ['ems'],
      ['data center'],
      ['telecom'],
      ['automotive electronics'],
      ['server racks'],
    ],
    answer: () =>
      [
        'The near-term wedge is electronics manufacturing and data-center hardware, especially dense server-rack assembly where one cable or component mistake is expensive.',
        '',
        'From there, the deck expands to telecom equipment and later to automotive electronics and industrial systems.',
        '',
        'The pilot narrative is grounded in real-world inspection of physical server racks, not abstract lab demos.',
      ].join('\n'),
  },
  {
    id: 'product-line',
    groups: [
      ['product line'],
      ['what products'],
      ['which products'],
      ['products'],
      ['repos'],
    ],
    answer: (config) =>
      [
        'Current RoboQC product line:',
        ...config.links.products.map((product) => `- ${product.title}: ${product.description}`),
      ].join('\n'),
  },
];

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9#]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function matchesGroup(normalizedText: string, group: readonly string[]): boolean {
  return group.every((term) => normalizedText.includes(term));
}

export function getSuggestedEnglishQuestions(): readonly string[] {
  return SUGGESTED_QUESTIONS;
}

export function findEnglishKnowledgeReply(
  text: string,
  config: AppConfig,
): KnowledgeReply | null {
  const normalizedText = normalizeText(text);

  if (!normalizedText || normalizedText.startsWith('/')) {
    return null;
  }

  for (const entry of ENGLISH_FAQ) {
    if (entry.groups.some((group) => matchesGroup(normalizedText, group))) {
      return {
        id: entry.id,
        text: entry.answer(config),
      };
    }
  }

  return null;
}
