import dotenv from 'dotenv';

dotenv.config();

export interface ProductLink {
  slug: string;
  title: string;
  description: string;
  url: string;
}

export interface ProjectLinks {
  site: string;
  telegramBot: string;
  telegramHandle: string;
  githubOrg: string;
  linkedin: string;
  products: ProductLink[];
}

export interface BotProfile {
  name: string;
  oneLiner: string;
  summary: string;
  capabilities: string[];
}

export interface AppConfig {
  port: number;
  telegramBotToken: string;
  telegramBotUsername: string;
  publicBaseUrl: string;
  webhookDomain: string | null;
  telegramWebhookPath: string;
  telegramWebhookSecret: string | null;
  botProfile: BotProfile;
  links: ProjectLinks;
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalEnv(name: string): string | null {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

function parsePort(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? '8080', 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Invalid PORT value: ${value}`);
  }
  return parsed;
}

function normalizePath(pathValue: string | undefined): string {
  const value = (pathValue ?? '/telegram/webhook').trim() || '/telegram/webhook';
  return value.startsWith('/') ? value : `/${value}`;
}

function normalizeBaseUrl(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

export function loadConfig(): AppConfig {
  const publicBaseUrl = normalizeBaseUrl(
    process.env.PUBLIC_BASE_URL?.trim() || 'https://romeoflexvision.com',
  );
  const webhookDomain = optionalEnv('WEBHOOK_DOMAIN');

  if (webhookDomain && !/^https:\/\//.test(webhookDomain)) {
    throw new Error('WEBHOOK_DOMAIN must start with https://');
  }

  return {
    port: parsePort(process.env.PORT),
    telegramBotToken: requireEnv('TELEGRAM_BOT_TOKEN'),
    telegramBotUsername: process.env.TELEGRAM_BOT_USERNAME?.trim() || 'RomeoFlexVision_bot',
    publicBaseUrl,
    webhookDomain: webhookDomain ? normalizeBaseUrl(webhookDomain) : null,
    telegramWebhookPath: normalizePath(process.env.TELEGRAM_WEBHOOK_PATH),
    telegramWebhookSecret: optionalEnv('TELEGRAM_WEBHOOK_SECRET'),
    botProfile: {
      name: 'RoboQC Bot',
      oneLiner: 'Public Telegram entrypoint for the RoboQC landing.',
      summary:
        'I help visitors understand what RoboQC is, open the live landing, review the product line, and jump to GitHub or LinkedIn.',
      capabilities: [
        'Explain the RoboQC positioning and pilot story',
        'Open the live landing and demo surface',
        'List RoboQC Inspector, Andrew Analytic, Romeo PhD, and Bassito',
        'Route visitors to GitHub, LinkedIn, and public contact surfaces',
      ],
    },
    links: {
      site: publicBaseUrl,
      telegramBot: 'https://t.me/RomeoFlexVision_bot',
      telegramHandle: '@RomeoFlexVision_bot',
      githubOrg: 'https://github.com/aleksandrlyubarev-blip',
      linkedin: 'https://www.linkedin.com/company/romeoflexvision',
      products: [
        {
          slug: 'roboqc',
          title: 'RoboQC Inspector',
          description: 'The camera-robot for inline quality control and station-level defect capture.',
          url: 'https://github.com/aleksandrlyubarev-blip/RomeoFlexVision',
        },
        {
          slug: 'andrew',
          title: 'Andrew Analytic',
          description: 'Station analytics, routing, validation, and root-cause review.',
          url: 'https://github.com/aleksandrlyubarev-blip/Andrew-Analitic',
        },
        {
          slug: 'romeo',
          title: 'Romeo PhD',
          description: 'Readable reports, operator handoff, and technical explanation.',
          url: 'https://github.com/aleksandrlyubarev-blip/Romeo_PHD',
        },
        {
          slug: 'bassito',
          title: 'Bassito',
          description: 'Training media and pilot enablement for repeated defect scenarios.',
          url: 'https://github.com/aleksandrlyubarev-blip/Bassito',
        },
      ],
    },
  };
}
