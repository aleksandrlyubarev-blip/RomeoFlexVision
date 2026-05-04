# RoboQC 90-Day Launch Plan (OME-style)

**Branch:** `claude/roboqc-90day-launch-WgUEV` (оба репо)
**Window:** 2026-04-21 → 2026-07-21
**Founder mode:** Architect, 2h/day review only. Operational execution — Claude Code + subagents.
**Primary wedge (weeks 1-4):** Architecture v1.0

## Context

Research rabbit holes съедают дни → пилоты откладываются → revenue не стартует. Архитектура не зафиксирована. MVP нельзя собрать на shaky foundation.

Уже есть сильный фундамент:
- **Romeo_PHD** — pipeline-платформа (Express 5 + Kahn YAML parser + LLM workers + HITL + Monaco IDE + React Flow + Postgres)
- **RomeoFlexVision** — landing + telegram-bot + voice-gateway
- **Brigada architecture** — General/Majors/Sergeants/Soldiers иерархия для synthetic defect data
- **Buxter** — отдельная MAS для CAD-автоматизации

## Outcome к 2026-07-21

1. Architecture v1.0 зафиксирована в обоих репо
2. Research Agent работает автономно
3. MVP RoboQC на 1 пилоте (1 фабрика + 1 дефект) живой
4. Sales kit v2 готов к 5 пилотам Q3

## Phase 1: Architecture v1.0 (Weeks 1-4)

**Deliverables:**
- `docs/architecture-v1.0.md` — Mermaid Hybrid Hierarchical Multi-Agent Graph
- `CLAUDE.md` в обоих репо
- `artifacts/deepagents-runtime/` в romeo_phd — PoC поверх существующего pipeline-executor
- `docs/decisions/adr-001..004-*.md` — orchestrator / hierarchy / edge stack / HITL boundary

**Reuse вместо переписывания:**
- `romeo_phd:artifacts/api-server/src/lib/pipeline-parser.ts` — Kahn's Algorithm уже есть
- `romeo_phd:artifacts/api-server/src/lib/pipeline-executor.ts` — LLM workers + HITL pause/resume
- `romeo_phd:artifacts/romeo-phd/src/pages/consultations.tsx` — HITL UI
- `romeo_phd:lib/integrations-anthropic-ai/` — Anthropic SDK
- `romeoflexvision:docs/brigada-architecture.md` — источник иерархии

**Exit criteria:**
- [ ] architecture-v1.0.md подписан всеми 4 ADR
- [ ] CLAUDE.md в обоих репо
- [ ] DeepAgents PoC проходит end-to-end demo (YAML → agents → image → annotated output)

## Phase 2: Research Agent + MVP Scoping (Weeks 5-8)

**Deliverables:**
- `artifacts/research-agent/` в romeo_phd — URL → summary → tradeoff → decision record
- `docs/pilot-wedge-selection.md` — матрица фабрика×дефект, финальный выбор
- Operator UI spec — role-based, offline, 1C-MES/OPC UA hooks
- SOW-lite для пилотной фабрики

**Exit criteria:**
- [ ] Research Agent обработал ≥10 items/неделю без founder intervention
- [ ] Выбрана фабрика + дефект, подписан SOW-lite
- [ ] Operator UI spec approved

## Phase 3: Pilot #1 Live + Sales Kit (Weeks 9-12)

**Deliverables:**
- RoboQC MVP в production: Docker stack + edge inference sub-200ms + operator UI + PLC action + audit trail
- `docs/case-study-template.md`
- Pitch-deck v2 с реальными цифрами пилота
- Pricing page на romeoflexvision.com
- Telegram-bot расширен под inbound qualification

**Exit criteria:**
- [ ] Pilot #1 в production, metrics за ≥2 недели
- [ ] Case study опубликован
- [ ] ≥3 qualified leads в pipeline на Q3

## Risks

| Risk | Mitigation |
|---|---|
| Research creep | Phase 1 ADRs freeze core. Новое идёт в Research Agent backlog. |
| 2h/день не хватит | Daily digest от agents (5 min summary) |
| Pilot customer пропадает | ≥3 backup candidates в wedge selection |
| Edge inference >200ms | Phase 2 early benchmarks на реальной камере |

## What this plan is NOT

- Не roadmap новых research directions
- Не полный go-to-market
- Не hiring plan
- Не финмодель
