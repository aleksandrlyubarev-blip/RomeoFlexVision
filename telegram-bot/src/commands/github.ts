import type { Context } from 'telegraf';
import { Markup } from 'telegraf';
import { LINKS } from '../config.js';

export async function handleGithub(ctx: Context): Promise<void> {
  await ctx.reply(
    `💻 *GitHub — aleksandrlyubarev-blip*\n\n` +
      `All public repositories for the RomeoFlexVision ecosystem including Andrew Swarm, Romeo PhD, Bassito, and PinoCut.`,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.url('Open GitHub Organisation', LINKS.github)],
        [
          Markup.button.url('Andrew Swarm', LINKS.products.andrew),
          Markup.button.url('Romeo PhD', LINKS.products.romeo),
        ],
        [
          Markup.button.url('Bassito', LINKS.products.bassito),
          Markup.button.url('PinoCut', LINKS.products.pinocut),
        ],
      ]),
    },
  );
}
