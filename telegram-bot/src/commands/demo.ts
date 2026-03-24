import { Markup } from 'telegraf';
import type { AppConfig } from '../config.js';
import type { RomeoBot } from '../bot.js';

export function registerDemoCommand(bot: RomeoBot, config: AppConfig): void {
  bot.command('demo', async (ctx) => {
    await ctx.reply(
      'Live demo and product surface:',
      Markup.inlineKeyboard([
        [Markup.button.url('Open romeoflexvision.com', config.links.site)],
      ]),
    );
  });
}

