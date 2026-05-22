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
  leadCapturePath: string;
  leadNotifyChatIds: string[];
  leadAllowedOrigins: string[];
  leadRateLimitPerMinute: number;
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

function parseCsvList(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? String(fallback), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Invalid numeric value: ${value}`);
  }
  return parsed;
}

function normalizeOriginList(origins: string[], publicBaseUrl: string): string[] {
  const defaults = [publicBaseUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'];
  const combined = origins.length > 0 ? origins : defaults;

  return Array.from(
    new Set(
      combined.map((origin) => {
        try {
          return new URL(origin).origin;
        } catch {
          throw new Error(`Invalid origin URL: ${origin}`);
        }
      }),
    ),
  );
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
    leadCapturePath: normalizePath(process.env.LEAD_CAPTURE_PATH ?? '/api/leads'),
    leadNotifyChatIds: parseCsvList(process.env.LEAD_NOTIFY_CHAT_IDS),
    leadAllowedOrigins: normalizeOriginList(parseCsvList(process.env.LEAD_ALLOWED_ORIGINS), publicBaseUrl),
    leadRateLimitPerMinute: parsePositiveInt(process.env.LEAD_RATE_LIMIT_PER_MINUTE, 10),
    botProfile: {
      name: 'NeutronVision Bot',
      oneLiner: 'Public Telegram entrypoint for NeutronVision QC.',
      summary:
        'I help visitors understand what NeutronVision QC is, answer English product questions about inline visual quality control, open the live landing, and jump to GitHub or LinkedIn.',
      capabilities: [
        'Explain NeutronVision QC positioning and the pilot story',
        'Answer English questions about edge deployment, station-level defects, and the open execution layer',
        'Open the live landing and demo surface',
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
          slug: 'neutronvision-qc',
          title: 'NeutronVision QC',
          description:
            'AI visual quality control for electronics and AI-hardware assembly: catches station-level defects inline, before end-of-line test.',
          url: 'https://github.com/aleksandrlyubarev-blip/RomeoFlexVision',
        },
      ],
    },
  };
}
