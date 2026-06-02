# RomeoFlexVision Telegram Bot

Public Telegram entrypoint for the RomeoFlexVision research and demo surface.

The bot is intentionally lightweight:

- `/start` opens the main navigation
- `/about` explains the public system map
- `/help` shows the available commands
- `/demo` routes users to the live landing
- `/products` describes the public software surface
- `/github` opens the GitHub surfaces
- `/contact` routes users to public contact points
- `POST /api/leads` accepts landing-form messages and forwards them to configured Telegram admin chats

## Local development

```bash
cp .env.example .env
npm install
npm run dev
```

Required environment variables:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_BOT_USERNAME`

Optional production variables are documented in `.env.example`.

## Security

Do not commit Telegram tokens.
