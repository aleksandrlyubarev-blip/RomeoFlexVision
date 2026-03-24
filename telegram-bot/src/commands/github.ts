import { Markup } from 'telegraf';
import type { AppConfig } from '../config.js';
import type { RomeoBot } from '../bot.js';

export function registerGithubCommand(bot: RomeoBot, config: AppConfig): void {
  bot.command('github', async (ctx) => {
    await ctx.reply(
      [
        'GitHub surfaces for RomeoFlexVision:',
        `- Org: ${config.links.githubOrg}`,
        ...config.links.products.map((product) => `- ${product.title}: ${product.url}`),
      ].join('\n'),
      Markup.inlineKeyboard([
        [Markup.button.url('Open GitHub org', config.links.githubOrg)],
      ]),
    );
  });
}

