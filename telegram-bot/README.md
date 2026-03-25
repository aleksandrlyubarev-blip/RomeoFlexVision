# RoboQC Telegram Bot

Public Telegram entrypoint for the RoboQC product surface, powered by Romeo FlexVision.

The bot is intentionally lightweight:

- `/start` opens the main navigation and pilot links
- `/about` explains the bot and the RoboQC positioning
- `/help` shows the available commands
- `/demo` routes users to the live landing
- `/products` lists the current RoboQC product line
- `/github` opens the GitHub surfaces
- `/contact` routes users to public contact points

## Modes

- `WEBHOOK_DOMAIN` set: Express exposes a Telegram webhook endpoint
- `WEBHOOK_DOMAIN` empty: the service falls back to long polling for development

## Local development

```bash
cd telegram-bot
cp .env.example .env
npm install
npm run dev
```

## Production

```bash
cd telegram-bot
npm install
npm run build
npm start
```

Required environment variables:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_BOT_USERNAME`

Optional production variables:

- `WEBHOOK_DOMAIN`
- `TELEGRAM_WEBHOOK_PATH`
- `TELEGRAM_WEBHOOK_SECRET`
- `PUBLIC_BASE_URL`

## Security

Do not commit Telegram tokens.
