import { Telegraf } from 'telegraf';
import { config } from './config.js';
import { handleStart } from './commands/start.js';
import { handleHelp } from './commands/help.js';
import { handleProducts } from './commands/products.js';
import { handleGithub } from './commands/github.js';
import { handleContact } from './commands/contact.js';
import { handleDemo } from './commands/demo.js';

export function createBot(): Telegraf {
  if (!config.botToken) {
    throw new Error('TELEGRAM_BOT_TOKEN is not set');
  }

  const bot = new Telegraf(config.botToken);

  bot.start(handleStart);
  bot.help(handleHelp);
  bot.command('products', handleProducts);
  bot.command('github', handleGithub);
  bot.command('contact', handleContact);
  bot.command('demo', handleDemo);

  // Wire inline keyboard callbacks from /start
  bot.action('products', async (ctx) => {
    await ctx.answerCbQuery();
    await handleProducts(ctx);
  });
  bot.action('contact', async (ctx) => {
    await ctx.answerCbQuery();
    await handleContact(ctx);
  });

  // Only respond with the "unknown command" hint for messages that look
  // like commands; stay silent on natural text to avoid noise.
  bot.on('text', async (ctx) => {
    const text = ctx.message?.text;
    if (text?.startsWith('/')) {
      await ctx.reply(
        'Unknown command. Use /help to see available commands.',
      );
    }
  });

  bot.catch((err, ctx) => {
    console.error(`Bot error for update ${ctx.update.update_id}:`, err);
  });

  return bot;
}
