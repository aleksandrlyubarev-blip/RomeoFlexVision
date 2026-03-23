import express from 'express';
import { createBot } from './bot.js';
import { config } from './config.js';

const app = express();
app.use(express.json());

const bot = createBot();

if (config.webhookDomain) {
  // Production: use webhook
  const webhookPath = `/webhook/${config.webhookSecret || 'rfv-bot'}`;

  app.post(webhookPath, (req, res) => {
    bot.handleUpdate(req.body, res);
  });

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', mode: 'webhook' });
  });

  app.listen(config.port, async () => {
    const webhookUrl = `${config.webhookDomain}${webhookPath}`;
    await bot.telegram.setWebhook(webhookUrl);
    console.log(`Bot running via webhook: ${webhookUrl}`);
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

  bot.launch({ dropPendingUpdates: true }).then(() => {
    console.log('Bot running via long polling');
  });

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}
