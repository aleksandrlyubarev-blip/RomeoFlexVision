import type { Context } from 'telegraf';
import { Markup } from 'telegraf';
import { LINKS } from '../config.js';

export async function handleStart(ctx: Context): Promise<void> {
  const name = ctx.from?.first_name ?? 'there';

  await ctx.reply(
    `👋 Hi ${name}! Welcome to *RomeoFlexVision* — an agentic AI ecosystem for data science and automated media production.\n\n` +
      `Here you can:\n` +
      `• Browse our AI agent products\n` +
      `• Navigate to demos and repos\n` +
      `• Get in touch with the team\n\n` +
      `Use the menu below or type /help to see all commands.`,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [
          Markup.button.url('🌐 Website', LINKS.site),
          Markup.button.url('💻 GitHub', LINKS.github),
        ],
        [
          Markup.button.callback('🤖 Products', 'products'),
          Markup.button.callback('📬 Contact', 'contact'),
        ],
      ]),
    },
  );
}
