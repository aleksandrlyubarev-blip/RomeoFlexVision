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

  // Echo unknown commands back with a hint
  bot.on('text', async (ctx) => {
    await ctx.reply(
      'Unknown command. Use /help to see available commands.',
    );
  });

  bot.catch((err, ctx) => {
    console.error(`Bot error for update ${ctx.update.update_id}:`, err);
  });

  return bot;
}
