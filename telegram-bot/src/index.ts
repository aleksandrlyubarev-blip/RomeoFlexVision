import express from 'express';
import type { Request, Response } from 'express';
import { createBot, syncBotMetadata } from './bot.js';
import { loadConfig } from './config.js';

async function main(): Promise<void> {
  const config = loadConfig();
  const bot = createBot(config);
  await syncBotMetadata(bot, config);

  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '1mb' }));

  app.get('/', (_req: Request, res: Response) => {
    res.json({
      ok: true,
      service: 'romeoflexvision-telegram-bot',
      mode: config.webhookDomain ? 'webhook' : 'polling',
      bot: config.telegramBotUsername,
    });
  });

  app.get('/healthz', (_req: Request, res: Response) => {
    res.json({
      ok: true,
      bot: config.telegramBotUsername,
      mode: config.webhookDomain ? 'webhook' : 'polling',
    });
  });

  if (config.webhookDomain) {
    app.post(config.telegramWebhookPath, async (req: Request, res: Response) => {
      if (
        config.telegramWebhookSecret &&
        req.header('x-telegram-bot-api-secret-token') !== config.telegramWebhookSecret
      ) {
        res.status(401).json({ ok: false, error: 'Invalid Telegram webhook secret' });
        return;
      }

      try {
        await bot.handleUpdate(req.body, res);
        if (!res.headersSent) {
          res.status(200).json({ ok: true });
        }
      } catch (error) {
        console.error('Failed to handle Telegram update:', error);
        if (!res.headersSent) {
          res.status(500).json({ ok: false, error: 'Webhook handling failed' });
        }
      }
    });
  } else {
    await bot.launch();
  }

  const server = app.listen(config.port, () => {
    console.log(
      `romeoflexvision-telegram-bot listening on port ${config.port} (${config.webhookDomain ? 'webhook' : 'polling'} mode)`,
    );
  });

  const shutdown = async (signal: string) => {
    console.log(`Shutting down Telegram bot (${signal})`);
    server.close(() => {
      console.log('HTTP server closed');
    });
    await bot.stop(signal);
  };

  process.once('SIGINT', () => {
    void shutdown('SIGINT');
  });
  process.once('SIGTERM', () => {
    void shutdown('SIGTERM');
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

