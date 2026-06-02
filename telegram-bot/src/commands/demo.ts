import { Markup } from 'telegraf';
import type { AppConfig } from '../config.js';
import type { RomeoBot } from '../bot.js';

export function registerDemoCommand(bot: RomeoBot, config: AppConfig): void {
  bot.command('demo', async (ctx) => {
    await ctx.reply(
      'Public research and demo landing:',
      Markup.inlineKeyboard([[Markup.button.url('Open RomeoFlexVision landing', config.links.site)]]),
    );
  });
}
