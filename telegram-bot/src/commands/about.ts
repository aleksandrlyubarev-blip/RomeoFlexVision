import { Markup } from 'telegraf';
import type { AppConfig } from '../config.js';
import type { RomeoBot } from '../bot.js';

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

async function replyWithAbout(
  botReply: (text: string, extra?: unknown) => Promise<unknown>,
  config: AppConfig,
) {
  await botReply(
    buildAboutMessage(config),
    Markup.inlineKeyboard([
      [
        Markup.button.url('Open landing', config.links.site),
        Markup.button.url('GitHub', config.links.githubOrg),
      ],
      [Markup.button.url('LinkedIn', config.links.linkedin)],
    ]),
  );
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

    await ctx.reply(
      [
        `I am ${config.botProfile.name}.`,
        config.botProfile.oneLiner,
        '',
        'Ask me who I am, what I do, or use /about /demo /products /github /contact.',
      ].join('\n'),
    );
  });
}
