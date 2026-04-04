import type { Express, Request, Response } from 'express';
import type { RomeoBot } from './bot.js';
import type { AppConfig } from './config.js';

interface LeadPayload {
  name: string;
  company: string;
  email: string;
  message: string;
  language: 'en' | 'he';
  pageUrl: string;
  source: string;
}

type LeadRequestBody = Partial<LeadPayload> & {
  website?: string;
};

const RATE_LIMIT_WINDOW_MS = 60_000;
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function getRequestIp(req: Request): string {
  return (req.header('x-forwarded-for') ?? req.socket.remoteAddress ?? 'unknown')
    .split(',')[0]
    .trim();
}

function normalizeOrigin(origin: string): string | null {
  try {
    return new URL(origin).origin;
  } catch {
    return null;
  }
}

function isOriginAllowed(origin: string | undefined, config: AppConfig): boolean {
  if (!origin) {
    return true;
  }

  const normalized = normalizeOrigin(origin);
  return normalized ? config.leadAllowedOrigins.includes(normalized) : false;
}

function applyCors(req: Request, res: Response, config: AppConfig): void {
  const origin = req.header('origin');
  if (!origin || !isOriginAllowed(origin, config)) {
    return;
  }

  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function checkRateLimit(ip: string, config: AppConfig): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(ip);
  if (!bucket || bucket.resetAt <= now) {
    rateBuckets.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (bucket.count >= config.leadRateLimitPerMinute) {
    return false;
  }

  bucket.count += 1;
  return true;
}

function normalizeText(value: unknown, maxLength: number): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function parseLeadPayload(body: LeadRequestBody): { payload?: LeadPayload; error?: string; spam?: boolean } {
  if (normalizeText(body.website, 256)) {
    return { spam: true };
  }

  const name = normalizeText(body.name, 120);
  const company = normalizeText(body.company, 160);
  const email = normalizeText(body.email, 200);
  const message = normalizeText(body.message, 4000);
  const source = normalizeText(body.source, 80) || 'romeoflexvision.com';
  const pageUrl = normalizeText(body.pageUrl, 500);
  const language = body.language === 'he' ? 'he' : 'en';

  if (!name) {
    return { error: 'Name is required' };
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'Valid email is required' };
  }
  if (!message) {
    return { error: 'Message is required' };
  }

  return {
    payload: {
      name,
      company,
      email,
      message,
      language,
      pageUrl,
      source,
    },
  };
}

function formatLeadMessage(payload: LeadPayload): string {
  return [
    'New website lead',
    `Name: ${payload.name}`,
    `Company: ${payload.company || '-'}`,
    `Email: ${payload.email}`,
    `Language: ${payload.language}`,
    `Source: ${payload.source}`,
    `Page: ${payload.pageUrl || '-'}`,
    '',
    'Request:',
    payload.message,
  ].join('\n');
}

export function registerLeadCaptureRoutes(
  app: Express,
  bot: RomeoBot,
  config: AppConfig,
): void {
  app.options(config.leadCapturePath, (req, res) => {
    applyCors(req, res, config);
    res.status(204).end();
  });

  app.post(config.leadCapturePath, async (req, res) => {
    applyCors(req, res, config);

    if (!isOriginAllowed(req.header('origin'), config)) {
      res.status(403).json({ ok: false, error: 'Origin is not allowed' });
      return;
    }

    if (config.leadNotifyChatIds.length === 0) {
      res.status(503).json({ ok: false, error: 'Lead capture is not configured' });
      return;
    }

    const ip = getRequestIp(req);
    if (!checkRateLimit(ip, config)) {
      res.status(429).json({ ok: false, error: 'Too many lead submissions' });
      return;
    }

    const { payload, error, spam } = parseLeadPayload((req.body ?? {}) as LeadRequestBody);

    if (spam) {
      res.status(202).json({ ok: true, accepted: true });
      return;
    }

    if (!payload) {
      res.status(400).json({ ok: false, error: error ?? 'Invalid lead payload' });
      return;
    }

    const message = formatLeadMessage(payload);
    const deliveries = await Promise.allSettled(
      config.leadNotifyChatIds.map((chatId) => bot.telegram.sendMessage(chatId, message)),
    );

    const delivered = deliveries.filter((item) => item.status === 'fulfilled').length;
    if (delivered === 0) {
      console.error('Lead capture delivery failed for all chats', deliveries);
      res.status(502).json({ ok: false, error: 'Lead delivery failed' });
      return;
    }

    res.status(202).json({ ok: true, delivered });
  });
}
