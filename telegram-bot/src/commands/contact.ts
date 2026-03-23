import type { Context } from 'telegraf';
import { Markup } from 'telegraf';
import { LINKS } from '../config.js';

export async function handleContact(ctx: Context): Promise<void> {
  await ctx.reply(
    `📬 *Get in touch*\n\n` +
      `For partnerships, integrations, and strategic conversations — reach out via Telegram or LinkedIn.\n\n` +
      `You can also reply directly in this chat and we'll get back to you.`,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.url('Telegram channel', LINKS.telegram)],
        [Markup.button.url('LinkedIn', LINKS.linkedin)],
      ]),
    },
  );
}
