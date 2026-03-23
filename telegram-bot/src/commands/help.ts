import type { Context } from 'telegraf';

export async function handleHelp(ctx: Context): Promise<void> {
  await ctx.reply(
    `*RomeoFlexVision Bot — Commands*\n\n` +
      `/start — Welcome message and quick navigation\n` +
      `/products — Browse our AI agent products\n` +
      `/demo — Open the live platform demo\n` +
      `/github — GitHub organisation and repositories\n` +
      `/contact — Get in touch with the team\n` +
      `/help — Show this message`,
    { parse_mode: 'Markdown' },
  );
}
