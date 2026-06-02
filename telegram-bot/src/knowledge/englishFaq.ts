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
  'What is RomeoFlexVision?',
  'What is Neuron Vision Display?',
  'What is RoboQC?',
  'What is Checker?',
  'What belongs in the public repository?',
] as const;

const ENGLISH_FAQ: readonly EnglishFaqEntry[] = [
  {
    id: 'romeoflexvision-overview',
    groups: [
      ['what is', 'romeoflexvision'],
      ['tell me about', 'romeoflexvision'],
    ],
    answer: (config) =>
      [
        'RomeoFlexVision is the agent-system and legal submission wrapper.',
        '',
        'The public repository is a research and demo surface for visual inspection workflows, evidence logging, and human review.',
        '',
        `Public landing: ${config.links.site}`,
      ].join('\n'),
  },
  {
    id: 'neuron-vision-display',
    groups: [
      ['what is', 'neuron vision display'],
      ['display', 'software'],
    ],
    answer: () =>
      [
        'Neuron Vision Display is visual inspection software.',
        '',
        'The public demo focuses on assisted review and evidence logging.',
      ].join('\n'),
  },
  {
    id: 'roboqc',
    groups: [
      ['what is', 'roboqc'],
      ['roboqc', 'hardware'],
    ],
    answer: () => 'RoboQC is inspection robot hardware.',
  },
  {
    id: 'checker',
    groups: [
      ['what is', 'checker'],
      ['checker', 'scanner'],
    ],
    answer: () => 'Checker is the manual scanner used for operator-led inspection steps.',
  },
  {
    id: 'public-boundary',
    groups: [
      ['public', 'repository'],
      ['public', 'boundary'],
      ['what belongs', 'public'],
    ],
    answer: () =>
      [
        'The public repository is limited to public datasets, synthetic examples, and generic inspection concepts.',
        '',
        'It does not represent a production customer deployment.',
      ].join('\n'),
  },
  {
    id: 'system-map',
    groups: [
      ['system map'],
      ['products'],
      ['what do you build'],
    ],
    answer: (config) =>
      [
        'Public system map:',
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
