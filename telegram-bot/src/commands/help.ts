import type { AppConfig } from '../config.js';
import type { RomeoBot } from '../bot.js';

export function registerHelpCommand(bot: RomeoBot, _config: AppConfig): void {
  bot.command('help', async (ctx) => {
    await ctx.reply(
      [
        'Available commands:',
        '/start - main navigation and public links',
        '/help - command list',
        '/demo - open the live RomeoFlexVision site',
        '/products - ecosystem product summary',
        '/github - org and repository links',
        '/contact - public contact and company routes',
      ].join('\n'),
    );
  });
}

