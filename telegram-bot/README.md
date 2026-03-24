# RomeoFlexVision Telegram Bot

Public Telegram entrypoint for the RomeoFlexVision ecosystem.

The bot is intentionally lightweight:

- `/start` introduces the project and presents inline navigation
- `/help` explains the available commands
- `/demo` routes users to the live site
- `/products` lists the four ecosystem products
- `/github` opens the GitHub org and repos
- `/contact` routes users to public contact surfaces

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

The token previously shared in chat should be treated as compromised and rotated in `@BotFather` before this service is deployed.

