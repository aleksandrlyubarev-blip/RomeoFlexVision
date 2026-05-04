# Architecture Decision Records (ADR)

Это единственное место, где фиксируются architecture-level решения для RoboQC. Чаты и идеи в голове не считаются.

## Format

Каждый ADR имеет:
- **Status:** PROPOSED / ACCEPTED / DEPRECATED / SUPERSEDED-BY-XXX
- **Context:** почему вообще встал вопрос
- **Options:** 2-4 реально рассмотренных варианта
- **Decision:** выбранный вариант + обоснование через 4 критерия (edge latency / few-shot / integration / defect impact)
- **Consequences:** что это означает на практике

## Index

| # | Title | Status |
|---|---|---|
| [001](adr-001-orchestrator-choice.md) | Orchestrator choice (ROMA vs LangGraph vs Moltis) | 🟡 PROPOSED |
| 002 | Hierarchy roles & model sizes per level | ⚪️ TODO |
| 003 | Edge inference stack lock | ⚪️ TODO |
| 004 | HITL boundary policy | ⚪️ TODO |

## Process

1. Agent / founder пишет ADR со статусом PROPOSED
2. Founder review (в окне 2h/день)
3. При утверждении — status ACCEPTED, merge в ветку
4. Ссылка из architecture-v1.0.md обновляется на ACCEPTED
5. После этого core не меняется просто так — только через новый ADR с SUPERSEDED-BY
