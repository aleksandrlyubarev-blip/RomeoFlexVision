import type { Context } from 'telegraf';
import { Markup } from 'telegraf';
import { LINKS } from '../config.js';

export async function handleDemo(ctx: Context): Promise<void> {
  await ctx.reply(
    `🚀 *Live Demo*\n\n` +
      `Explore the RomeoFlexVision platform — agent catalog, scene operations dashboard, and the full multi-agent workspace.\n\n` +
      `No account required to browse the catalog and landing.`,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.url('Open RomeoFlexVision', LINKS.site)],
      ]),
    },
  );
}
