# ADR-001: Orchestrator choice (ROMA vs LangGraph vs Moltis)

**Status:** 🟡 PROPOSED (ждёт founder review)
**Date:** 2026-04-21 (Phase 1 Day 1)
**Deciders:** Founder + DeepAgents wrapper PoC results
**Supersedes:** —

## Context

RoboQC core нужен orchestration layer поверх иерархии General/Majors/Sergeants/Soldiers (см. brigada-architecture.md). Существующий `pipeline-executor.ts` в Romeo_PHD реализует Kahn's Algorithm DAG с HITL pause/resume — это рабочая основа. Вопрос — что использовать как higher-level orchestration фреймворк (для sub-graphs, multi-agent message passing, state checkpointing).

## Options

### Option A: ROMA

- **+** Native multi-agent graph semantic, поддерживает hierarchical sub-graphs из коробки
- **+** Ближе всего к Brigada hierarchy mental model
- **−** Моложе проект (community / docs / battle-testing meager)
- **−** TypeScript bindings нет или экспериментальные — Romeo_PHD весь на TS

### Option B: LangGraph

- **+** Зрелый ecosystem (LangChain), TypeScript SDK официальный
- **+** State checkpointing + interrupts уже мыслят в этих терминах
- **+** Можно обернуть существующий pipeline-executor как custom node
- **−** Hierarchical multi-agent — нужно ручно строить sub-graphs
- **−** Breaking changes в minor версиях (наблюдаемо в chats)

### Option C: Moltis

- **+** Новый, рассчитан на production multi-tenant
- **−** Founder ещё не строил PoC, integration cost неизвестен
- **−** Risk: опять попасть в research rabbit hole «does Moltis support X?»

### Option D: Stay with raw pipeline-executor.ts (no extra framework)

- **+** Zero new dependencies, уже работает
- **+** Founder всё понимает полностью
- **−** Hierarchy/sub-graphs нужно реализовывать руками
- **−** Части (state, interrupts, checkpointing) придётся писать повторно

## Decision criteria (4 критерия из CLAUDE.md)

| Criterion | A: ROMA | B: LangGraph | C: Moltis | D: Raw |
|---|---|---|---|---|
| Edge latency <200ms | ⚪️ n/a (cloud-side) | ⚪️ n/a | ⚪️ n/a | ⚪️ n/a |
| Few-shot 10-30 samples | ⚪️ n/a | ⚪️ n/a | ⚪️ n/a | ⚪️ n/a |
| Integration with TS stack | 🟡 weak | 🟢 strong | 🟡 unknown | 🟢 native |
| Defect impact (indirect via velocity) | 🟡 medium | 🟢 high | 🔴 low (delay) | 🟡 medium |

Критерии 1-2 не применимы — это cloud orchestration, не edge inference. Вес решения на критериях 3-4.

## Recommendation (предлагается принять)

**Option B: LangGraph TS** — обернуть существующий pipeline-executor.ts как LangGraph custom node, построить hierarchy как sub-graphs.

**Почему:**
- TypeScript-native — весь Romeo_PHD stack уже TS, нет polyglot overhead
- State checkpointing и interrupts хорошо ложатся на существующий HITL pattern в consultations.tsx
- Founder уже имеет экспозицию (видно из codex/mongodb-langgraph branch в romeo_phd)
- ROMA и Moltis риск research-rabbit-hole — founder уже потратил 3 недели на сравнения, пора фиксировать

**Pin version:** LangGraph TS на latest stable minor; upgrade policy — только через новый ADR

## Consequences

**Плюсы:**
- DeepAgents wrapper PoC пишется поверх LangGraph + pipeline-executor (один backend, два формата входа)
- Existing IDE (Monaco + React Flow) может визуализировать LangGraph state graph с минимальными изменениями
- Buxter (отдельный trail) может использовать тот же LangGraph runtime

**Минусы:**
- LangGraph minor versions ломают API — lock версию в package.json, upgrade только через ADR
- ROMA's hierarchical native semantics придётся эмулировать вручную (sub-graphs)
- Не используем LangChain Python — это осознанно (весь stack TS)

## Validation plan

До ACCEPTED статуса:
1. Spike: обернуть `pipeline-executor.ts` как LangGraph node (≤1 день)
2. End-to-end: 1 General + 2 Majors + 4 Sergeants в LangGraph, проходят через HITL pause
3. Founder review demo (≤1 час)

Если spike проваливается — fallback на Option D (raw pipeline-executor.ts) и новый ADR.

## Open questions

- [ ] LangGraph TS version фиксируем (будет уточнено в spike)
- [ ] Совместимость с существующим YAML format из pipeline-parser.ts (надеемся да)
- [ ] DeepAgents — обёртка поверх LangGraph или полный replacement? (решится в ADR-002)
