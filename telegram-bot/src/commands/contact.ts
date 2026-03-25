import { Markup } from 'telegraf';
import type { AppConfig } from '../config.js';
import type { RomeoBot } from '../bot.js';

export function registerContactCommand(bot: RomeoBot, config: AppConfig): void {
  bot.command('contact', async (ctx) => {
    await ctx.reply(
      [
        'Public contact routes:',
        `- Telegram bot: ${config.links.telegramHandle}`,
        `- LinkedIn: ${config.links.linkedin}`,
        `- Website: ${config.links.site}`,
        '',
        'Use the landing and LinkedIn page for company context, and use Telegram as the fastest public entry point.',
      ].join('\n'),
      Markup.inlineKeyboard([
        [
          Markup.button.url('Open bot', config.links.telegramBot),
          Markup.button.url('LinkedIn', config.links.linkedin),
        ],
        [Markup.button.url('Landing', config.links.site)],
      ]),
    );
  });
}
