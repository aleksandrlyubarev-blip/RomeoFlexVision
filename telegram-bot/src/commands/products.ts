import { Markup } from 'telegraf';
import type { AppConfig } from '../config.js';
import type { RomeoBot } from '../bot.js';

export function registerProductsCommand(bot: RomeoBot, config: AppConfig): void {
  bot.command('products', async (ctx) => {
    const message = config.links.products
      .map((product) => `- ${product.title}\n  ${product.description}\n  ${product.url}`)
      .join('\n\n');

    await ctx.reply(
      `Public system map:\n\n${message}`,
      Markup.inlineKeyboard(
        config.links.products.map((product) => [Markup.button.url(product.title, product.url)]),
      ),
    );
  });
}
