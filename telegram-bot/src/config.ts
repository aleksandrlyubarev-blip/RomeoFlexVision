export const config = {
  botToken: process.env.TELEGRAM_BOT_TOKEN ?? '',
  webhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET ?? '',
  webhookDomain: process.env.WEBHOOK_DOMAIN ?? '',
  port: Number(process.env.PORT ?? 3000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
} as const;

export const LINKS = {
  site: 'https://romeoflexvision.com',
  github: 'https://github.com/aleksandrlyubarev-blip',
  telegram: 'https://t.me/RomeoFlexVision_bot',
  linkedin: 'https://www.linkedin.com/company/112507945/',
  products: {
    andrew: 'https://github.com/aleksandrlyubarev-blip/Andrew-Analitic',
    romeo: 'https://github.com/aleksandrlyubarev-blip/Romeo_PHD',
    bassito: 'https://github.com/aleksandrlyubarev-blip/Bassito',
    pinocut: 'https://github.com/aleksandrlyubarev-blip/Pino_cut',
  },
} as const;
