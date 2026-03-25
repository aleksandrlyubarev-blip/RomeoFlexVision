import { Markup } from 'telegraf';
import type { AppConfig } from '../config.js';
import type { RomeoBot } from '../bot.js';

export function registerDemoCommand(bot: RomeoBot, config: AppConfig): void {
  bot.command('demo', async (ctx) => {
    await ctx.reply(
      'Live landing and pilot surface:',
      Markup.inlineKeyboard([[Markup.button.url('Open RoboQC landing', config.links.site)]]),
    );
  });
}
