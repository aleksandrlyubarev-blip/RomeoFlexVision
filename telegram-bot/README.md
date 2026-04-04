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
- `POST /api/leads` accepts landing-form leads and forwards them to configured Telegram admin chats

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
- `LEAD_CAPTURE_PATH`
- `LEAD_NOTIFY_CHAT_IDS`
- `LEAD_ALLOWED_ORIGINS`
- `LEAD_RATE_LIMIT_PER_MINUTE`

## Lead capture endpoint

The service can also act as the public lead-ingestion backend for the landing.

Required extra environment variable:

- `LEAD_NOTIFY_CHAT_IDS`

Optional:

- `LEAD_CAPTURE_PATH` defaults to `/api/leads`
- `LEAD_ALLOWED_ORIGINS` defaults to `PUBLIC_BASE_URL`, `http://localhost:5173`, `http://127.0.0.1:5173`
- `LEAD_RATE_LIMIT_PER_MINUTE` defaults to `10`

Example request:

```bash
curl -X POST http://localhost:8080/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alex",
    "company": "Romeo FlexVision",
    "email": "alex@example.com",
    "message": "Need a pilot for electronics assembly QC",
    "language": "en",
    "pageUrl": "https://romeoflexvision.com/",
    "source": "romeoflexvision.com"
  }'
```

## Security

Do not commit Telegram tokens.
