import { Markup } from 'telegraf';
import type { AppConfig } from '../config.js';
import type { RomeoBot } from '../bot.js';
import { buildHelpMessage } from './help.js';

export function registerStartCommand(bot: RomeoBot, config: AppConfig): void {
  bot.start(async (ctx) => {
    const message = [
      'RomeoFlexVision is the agent-system and legal submission wrapper.',
      '',
      'Use this bot to:',
      '- open the public research and demo landing',
      '- learn the public system map',
      '- ask English questions about RoboQC, Neuron Vision Display, Checker, and RomeoFlexVision',
      '- jump to GitHub, LinkedIn, and public contact routes',
      '',
      'Example: "What is Neuron Vision Display?"',
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
      `Public system map:\n${summary}`,
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
