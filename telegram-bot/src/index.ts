import express, { type Request, type Response, type NextFunction } from 'express';
import { createBot } from './bot.js';
import { config } from './config.js';

const app = express();
app.use(express.json());

const bot = createBot();

if (config.webhookDomain) {
  // Production: use webhook
  const webhookPath = `/webhook/${config.webhookSecret || 'rfv-bot'}`;
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET ?? '';

  if (!secret) {
    console.warn(
      'TELEGRAM_WEBHOOK_SECRET is not set; webhook endpoint will accept unsigned requests. ' +
        'Set TELEGRAM_WEBHOOK_SECRET in production.',
    );
  }

  app.post(webhookPath, (req: Request, res: Response, next: NextFunction) => {
    if (secret) {
      const provided = req.headers['x-telegram-bot-api-secret-token'];
      if (provided !== secret) {
        res.status(401).json({ error: 'invalid secret token' });
        return;
      }
    }
    bot.handleUpdate(req.body, res).catch(next);
  });

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', mode: 'webhook' });
  });

  app.listen(config.port, async () => {
    const webhookUrl = `${config.webhookDomain}${webhookPath}`;
    try {
      await bot.telegram.setWebhook(
        webhookUrl,
        secret ? { secret_token: secret } : undefined,
      );
      console.log(`Bot running via webhook: ${webhookUrl}`);
    } catch (err) {
      console.error('Failed to set Telegram webhook:', err);
    }
    console.log(`Server listening on port ${config.port}`);
  });
} else {
  // Development: use long polling
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', mode: 'polling' });
  });

  app.listen(config.port, () => {
    console.log(`Health endpoint on port ${config.port}`);
  });

  bot
    .launch({ dropPendingUpdates: true })
    .then(() => {
      console.log('Bot running via long polling');
    })
    .catch((err) => {
      console.error('Failed to launch bot:', err);
      process.exit(1);
    });

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}
