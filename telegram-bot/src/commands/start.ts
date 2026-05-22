import { Markup } from 'telegraf';
import type { AppConfig } from '../config.js';
import type { RomeoBot } from '../bot.js';
import { buildHelpMessage } from './help.js';

export function registerStartCommand(bot: RomeoBot, config: AppConfig): void {
  bot.start(async (ctx) => {
    const message = [
      'NeutronVision QC is inline AI visual quality control for electronics and AI-hardware assembly.',
      '',
      'Use this bot to:',
      '- open the live landing and pilot page',
      '- learn what NeutronVision QC inspects and how it deploys',
      '- ask English questions about edge deployment and the open execution layer',
      '- jump to GitHub, LinkedIn, and public contact routes',
      '',
      'Example: "Why do you focus on station #2 instead of station #5?"',
      '',
      'Available commands: /help /demo /products /github /contact',
    ].join('\n');

    await ctx.reply(
      message,
      Markup.inlineKeyboard([
        [
          Markup.button.url('Open landing', config.links.site),
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
      `What NeutronVision builds:\n${summary}`,
      Markup.inlineKeyboard(
        config.links.products.map((product) => [Markup.button.url(product.title, product.url)]),
      ),
    );
  });

  bot.action('help_menu', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply(buildHelpMessage());
  });
}
