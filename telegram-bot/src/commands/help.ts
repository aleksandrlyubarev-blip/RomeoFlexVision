import type { AppConfig } from '../config.js';
import type { RomeoBot } from '../bot.js';
import { getSuggestedEnglishQuestions } from '../knowledge/englishFaq.js';

export function buildHelpMessage(): string {
  return [
    'Available commands:',
    '/start - main navigation and public links',
    '/help - command list and example questions',
    '/demo - open the live RoboQC landing',
    '/products - RoboQC product summary',
    '/github - org and repository links',
    '/contact - public contact and company routes',
    '',
    'You can also ask plain-English questions such as:',
    ...getSuggestedEnglishQuestions().map((item) => `- ${item}`),
  ].join('\n');
}

export function registerHelpCommand(bot: RomeoBot, _config: AppConfig): void {
  bot.command('help', async (ctx) => {
    await ctx.reply(buildHelpMessage());
  });
}
