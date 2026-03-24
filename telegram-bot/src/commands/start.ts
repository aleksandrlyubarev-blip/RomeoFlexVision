import { Markup } from 'telegraf';
import type { AppConfig } from '../config.js';
import type { RomeoBot } from '../bot.js';

export function registerStartCommand(bot: RomeoBot, config: AppConfig): void {
  bot.start(async (ctx) => {
    const message = [
      'RomeoFlexVision is the public entry point into the agentic AI ecosystem.',
      '',
      'Use this bot to:',
      '- open the live site and demo',
      '- navigate products and repositories',
      '- jump to GitHub, LinkedIn, and public contact routes',
      '',
      'Available commands: /help /demo /products /github /contact',
    ].join('\n');

    await ctx.reply(
      message,
      Markup.inlineKeyboard([
        [
          Markup.button.url('Open site', config.links.site),
          Markup.button.url('GitHub', config.links.githubOrg),
        ],
        [
          Markup.button.callback('Products', 'products_menu'),
          Markup.button.callback('Help', 'help_menu'),
        ],
        [Markup.button.url('LinkedIn', config.links.linkedin)],
      ]),
    );
  });

  bot.action('products_menu', async (ctx) => {
    await ctx.answerCbQuery();
    const summary = config.links.products
      .map((product) => `- ${product.title}: ${product.description}`)
      .join('\n');

    await ctx.reply(
      `RomeoFlexVision products:\n${summary}`,
      Markup.inlineKeyboard([
        [
          Markup.button.url('Andrew', config.links.products[0].url),
          Markup.button.url('Romeo PhD', config.links.products[1].url),
        ],
        [
          Markup.button.url('Bassito', config.links.products[2].url),
          Markup.button.url('PinoCut', config.links.products[3].url),
        ],
      ]),
    );
  });

  bot.action('help_menu', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply(
      'Quick commands:\n/start\n/help\n/demo\n/products\n/github\n/contact',
    );
  });
}

