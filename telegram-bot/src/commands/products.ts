import type { Context } from 'telegraf';
import { Markup } from 'telegraf';
import { LINKS } from '../config.js';

const PRODUCTS = [
  {
    name: 'Andrew Swarm',
    eyebrow: 'Data Science Orchestration Agent',
    description:
      'Multi-model routing with sqlglot validation, AST safety, and sandboxed execution for analytics-heavy technical workflows.',
    status: '⚠️ Sprint 5 — Moltis integration',
    url: LINKS.products.andrew,
  },
  {
    name: 'Romeo PhD',
    eyebrow: 'Educational AI Companion',
    description:
      'A TypeScript monorepo for pedagogical explanation, technical tutoring, and developer-friendly reasoning flows.',
    status: '✅ v6.0',
    url: LINKS.products.romeo,
  },
  {
    name: 'Bassito',
    eyebrow: 'Automated Video Production Pipeline',
    description:
      'Script to background, voice, lip-sync, CTA5, and FFmpeg compositing through a Telegram-first production loop.',
    status: '🔵 Active pipeline',
    url: LINKS.products.bassito,
  },
  {
    name: 'PinoCut',
    eyebrow: 'Modular AI Video Assembly Agent',
    description:
      'Scene assembly that plugs into the wider ecosystem for automated rough cuts, structured timelines, and scene review.',
    status: '✅ v1.0 released',
    url: LINKS.products.pinocut,
  },
] as const;

export async function handleProducts(ctx: Context): Promise<void> {
  const lines = PRODUCTS.map(
    (p) =>
      `*${p.name}* — ${p.eyebrow}\n${p.description}\n${p.status}`,
  );

  await ctx.reply(
    `🤖 *RomeoFlexVision Products*\n\n${lines.join('\n\n')}`,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard(
        PRODUCTS.map((p) => [Markup.button.url(`→ ${p.name}`, p.url)]),
      ),
    },
  );
}
