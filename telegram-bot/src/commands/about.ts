import { Markup } from 'telegraf';
import type { AppConfig } from '../config.js';
import type { RomeoBot } from '../bot.js';
import { findEnglishKnowledgeReply, getSuggestedEnglishQuestions } from '../knowledge/englishFaq.js';

function buildAboutMessage(config: AppConfig): string {
  return [
    `${config.botProfile.name} - ${config.botProfile.oneLiner}`,
    '',
    config.botProfile.summary,
    '',
    'What I can do:',
    ...config.botProfile.capabilities.map((item) => `- ${item}`),
  ].join('\n');
}

function looksLikeSelfQuestion(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  const triggers = [
    'who are you',
    'what are you',
    'what do you do',
    'about you',
    'tell me about yourself',
    'about roboqc',
  ];

  return triggers.some((trigger) => normalized.includes(trigger));
}

function buildPrimaryKeyboard(config: AppConfig) {
  return Markup.inlineKeyboard([
    [
      Markup.button.url('Open landing', config.links.site),
      Markup.button.url('GitHub', config.links.githubOrg),
    ],
    [Markup.button.url('LinkedIn', config.links.linkedin)],
  ]);
}

function buildFallbackMessage(config: AppConfig): string {
  return [
    `I am ${config.botProfile.name}.`,
    config.botProfile.oneLiner,
    '',
    'I can answer product questions in English about RoboQC and Romeo FlexVision.',
    '',
    'Try questions like:',
    ...getSuggestedEnglishQuestions().map((item) => `- ${item}`),
    '',
    'You can also use /about /help /demo /products /github /contact.',
  ].join('\n');
}

type ReplyFn = (text: string, extra?: ReturnType<typeof buildPrimaryKeyboard>) => Promise<unknown>;

async function replyWithAbout(
  botReply: ReplyFn,
  config: AppConfig,
) {
  await botReply(buildAboutMessage(config), buildPrimaryKeyboard(config));
}

export function registerAboutCommand(bot: RomeoBot, config: AppConfig): void {
  bot.command('about', async (ctx) => {
    await replyWithAbout(ctx.reply.bind(ctx), config);
  });
}

export function registerSelfAnswerHandler(bot: RomeoBot, config: AppConfig): void {
  bot.on('text', async (ctx) => {
    const text = ctx.message.text?.trim();
    if (!text || text.startsWith('/')) {
      return;
    }

    if (looksLikeSelfQuestion(text)) {
      await replyWithAbout(ctx.reply.bind(ctx), config);
      return;
    }

    const knowledgeReply = findEnglishKnowledgeReply(text, config);
    if (knowledgeReply) {
      await ctx.reply(knowledgeReply.text, buildPrimaryKeyboard(config));
      return;
    }

    await ctx.reply(buildFallbackMessage(config), buildPrimaryKeyboard(config));
  });
}
