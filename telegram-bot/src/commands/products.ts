import { Markup } from 'telegraf';
import type { AppConfig } from '../config.js';
import type { RomeoBot } from '../bot.js';

export function registerProductsCommand(bot: RomeoBot, config: AppConfig): void {
  bot.command('products', async (ctx) => {
    const message = config.links.products
      .map((product) => `- ${product.title}\n  ${product.description}\n  ${product.url}`)
      .join('\n\n');

    await ctx.reply(
      `RoboQC product line:\n\n${message}`,
      Markup.inlineKeyboard([
        [
          Markup.button.url('RoboQC', config.links.products[0].url),
          Markup.button.url('Andrew', config.links.products[1].url),
        ],
        [
          Markup.button.url('Romeo PhD', config.links.products[2].url),
          Markup.button.url('Bassito', config.links.products[3].url),
        ],
      ]),
    );
  });
}
