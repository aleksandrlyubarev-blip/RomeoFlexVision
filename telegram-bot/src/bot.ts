import { Telegraf } from 'telegraf';
import type { Context } from 'telegraf';
import type { AppConfig } from './config.js';
import { registerAboutCommand, registerSelfAnswerHandler } from './commands/about.js';
import { registerContactCommand } from './commands/contact.js';
import { registerDemoCommand } from './commands/demo.js';
import { registerGithubCommand } from './commands/github.js';
import { registerHelpCommand } from './commands/help.js';
import { registerProductsCommand } from './commands/products.js';
import { registerStartCommand } from './commands/start.js';

export type RomeoBot = Telegraf<Context>;

export function createBot(config: AppConfig): RomeoBot {
  const bot = new Telegraf<Context>(config.telegramBotToken);

  bot.catch((error, ctx) => {
    console.error(`Telegram bot error for update ${ctx.update.update_id}:`, error);
  });

  registerStartCommand(bot, config);
  registerAboutCommand(bot, config);
  registerHelpCommand(bot, config);
  registerDemoCommand(bot, config);
  registerProductsCommand(bot, config);
  registerGithubCommand(bot, config);
  registerContactCommand(bot, config);
  registerSelfAnswerHandler(bot, config);

  return bot;
}

export async function syncBotMetadata(bot: RomeoBot, config: AppConfig): Promise<void> {
  await bot.telegram.setMyCommands([
    { command: 'start', description: 'Open the RoboQC navigation and pilot links' },
    { command: 'about', description: 'Explain what RoboQC is and what this bot does' },
    { command: 'help', description: 'Show available commands' },
    { command: 'demo', description: 'Open the live RoboQC landing' },
    { command: 'products', description: 'List RoboQC products and repos' },
    { command: 'github', description: 'Open GitHub org and repositories' },
    { command: 'contact', description: 'Get public contact routes' },
  ]);

  if (config.webhookDomain) {
    const webhookUrl = `${config.webhookDomain}${config.telegramWebhookPath}`;
    await bot.telegram.setWebhook(
      webhookUrl,
      config.telegramWebhookSecret ? { secret_token: config.telegramWebhookSecret } : undefined,
    );
    return;
  }

  await bot.telegram.deleteWebhook().catch(() => undefined);
}
