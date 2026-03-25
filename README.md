# RoboQC — Когнитивный QC-робот (Romeo FlexVision)

**RoboQC** — это робот-камера, которая никогда не спит. Ловит ошибки на станции №2, а не на тесте №5.

> Inline контроль качества · 90% дефектов в реальном времени · Powered by Romeo FlexVision

**Лендинг:** [romeoflexvision.com](https://romeoflexvision.com/)

---

## Что такое RoboQC

RoboQC — когнитивная система inline-инспекции качества на производстве, построенная на базе компьютерного зрения Romeo FlexVision. Работает прямо на производственных станциях, обнаруживает дефекты в реальном времени (< 50 мс) и мгновенно оповещает оператора через Telegram.

**Позиционирование:** «Робот-камера, которая никогда не спит. Ловит ошибки на станции №2, а не на тесте №5»

## Линейка продуктов

| Продукт | Описание |
|---|---|
| **RoboQC Vision** | Inline Camera Inspection Module — детекция дефектов в реальном времени |
| **RoboQC Analytics** | Defect Intelligence Dashboard — аналитика качества и тренды |
| **RoboQC Reporter** | Automated Quality Reporting Pipeline — автоотчёты по сменам в Telegram |
| **RoboQC Orchestrator** | Multi-Station QC Coordinator — оркестрация 5+ станций одновременно |

## Технологии

- **Компьютерное зрение:** Romeo FlexVision CV · OpenCV · Camera AI
- **Оркестрация:** LangGraph · ROMA · Moltis (Rust runtime)
- **Backend:** Python · FastAPI · TypeScript · Node.js
- **Интерфейс оператора:** Telegram Bot · React Dashboard
- **DevOps:** GitHub Actions · Docker · GitHub Pages

## Telegram Bot Backend

The repository also includes an isolated Telegram backend service at:

- [telegram-bot](telegram-bot)

It is a small Node.js + TypeScript service built with Telegraf and Express.
The bot is meant to work as the public entry point for RoboQC:

- `/start` for navigation
- `/demo` for the live site
- `/products` for RoboQC product modules
- `/github` for the org and repos
- `/contact` for pilot requests and contact handoff

The service supports both long polling for development and HTTPS webhook mode for deployment.

## SceneOps Integration

The frontend now exposes a single SceneOps seam for the multi-agent video workflow:

- `PinoCut` scene bundle and timing
- `Andrew-Analitic` review summary and confidence
- `Bassito` visual job queue state

Use `VITE_SCENE_OPS_URL` in `romeoflexvision/.env.example` to point the UI at a real JSON endpoint.
During local integration, the Andrew bridge can already serve a compatible demo payload at
`http://localhost:8100/scene/ops/demo`.
For GitHub Pages production, the app can also read a same-origin static snapshot from
`/scene-ops.json`, so `romeoflexvision.com` does not require a separate backend host.
If the variable is missing, the app falls back to a local mock snapshot so the UI can still be reviewed.

## SceneOps Sync Without External Hosting

This repository now includes a GitHub Actions workflow:

- [.github/workflows/sync-scene-ops.yml](.github/workflows/sync-scene-ops.yml)

It can refresh `romeoflexvision/public/scene-ops.json` in three ways:

1. `workflow_dispatch` with a `source_url`
2. `repository_dispatch` with `event_type=scene_ops_snapshot` and an inline `snapshot` payload
3. repository variable `SCENE_OPS_SOURCE_URL` for pull-based sync from a public JSON URL

If none of those are set, the workflow now falls back to the canonical public
snapshot in `PinoCut`:

- `https://raw.githubusercontent.com/aleksandrlyubarev-blip/Pino_cut/main/docs/pinnocat-scene-ops-v1.example.json`

The workflow also runs on a schedule every 6 hours, so the static Pages site can
keep following the shared SceneOps contract without needing a separate backend
host.

Every successful sync commits the updated `scene-ops.json` to `main`, which automatically triggers the Pages deploy workflow and updates `romeoflexvision.com`.
