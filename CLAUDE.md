# CLAUDE.md — RomeoFlexVision / RoboQC

Project memory for Claude Code agents working in this repo.

## What this repo is

Public product surface for **RoboQC** (робот-камера для inline visual QC в электронике), поверх внутренней технологии **Romeo FlexVision**. Инженерный backend (pipeline orchestrator, HITL UI, telemetry) живёт в сестринском репо [`romeo_phd`](https://github.com/aleksandrlyubarev-blip/Romeo_PHD).

## Layout

- `romeoflexvision/` — Vite/React landing (deployed to romeoflexvision.com)
- `telegram-bot/` — публичный вход для демо и пилотных заявок
- `voice-gateway/` — voice interface (экспериментальный)
- `docs/` — архитектурные доки. **Source of truth: [`docs/architecture-v1.0.md`](docs/architecture-v1.0.md)** (после Phase 1 sign-off)
- `docs/decisions/` — ADRs. Новые решения фиксируются здесь, не в чате
- `docs/90day-launch-plan.md` — текущий OME-style launch plan (Apr-Jul 2026)

## Tech stack (landing)

Vite + React 18 + TypeScript + Tailwind. ESLint flat config. Deploy via `.github/workflows/`.

## Common commands

```bash
cd romeoflexvision
npm install
npm run dev          # local landing :5173
npm run build
npm run lint
```

## Decision framework (4 criteria)

Каждый новый tool / model / library проходит через фильтр:

1. **Edge latency** — проходит ли sub-200ms на RTX 3060 / 4060?
2. **Few-shot** — работает ли на 10-30 samples (не требует 1000+ размеченных образцов)?
3. **Integration** — вписывается ли в ROMA / LangGraph orchestration layer (см. ADR-001)?
4. **Defect impact** — измеримо ли улучшает defect escape rate в электронике?

Если хотя бы 2 из 4 = no — в backlog Research Agent’а, не в core architecture.

## Brand & positioning

- Главный бренд: **RoboQC**
- Внутренняя технология: **Romeo FlexVision**
- Narrative: «Робот-камера, которая никогда не спит»
- CTA: «Запустить RoboQC-пилот»

## Founder mode (current)

2 часа/день, review-only. Агенты пишут PRs, founder утверждает. При любых architecture-level решениях — сначала ADR в `docs/decisions/`, потом код.
