# Агенты RHAEF v2

- Romeo Prime → Grok-4 (orchestrator + video) — арх. репо [Romeo_PHD](https://github.com/aleksandrlyubarev-blip/Romeo_PHD); моб. ядро [Romeo](https://github.com/aleksandrlyubarev-blip/Romeo) (private)
- Claude Architect / Claude Code → Opus 4.7 — встроен в `rhaef_v2/core/graph.py` (отдельного репо нет)
- Vision Master → GPT-5.5-pro — концепт в этом репо (отдельного репо не выявлено)
- Flex Executor → Opus 4.7 + hardware — заглушка `hardware_bridge_stub()` (реализации нет)
- Andrew Swarm v2 → Qwen 3.6-Plus — репо [Andrew-Analitic](https://github.com/aleksandrlyubarev-blip/Andrew-Analitic) («AI Agent Analitic DS»)
- Bassito Video → Grok-4 + Kling/Runway — репо [Bassito](https://github.com/aleksandrlyubarev-blip/Bassito) («Cartoon animator»)

> **Примечание.** Ростер — это индекс портфеля агентов, часть которых живёт в отдельных репозиториях
> (см. ниже). Привязки проставлены по имени/описанию репо и подлежат подтверждению чтением кода —
> на момент правки сессия имела доступ только к `romeoflexvision`.

# Портфель агентных репозиториев (кросс-ссылки)

Агенты, разрабатываемые как отдельные репозитории `aleksandrlyubarev-blip/*`:

| Репозиторий | Что | Связь с этим репо |
|---|---|---|
| [roboqc-agent-challenge](https://github.com/aleksandrlyubarev-blip/roboqc-agent-challenge) | Agentic visual QC for AI hardware | вероятно XPRIZE-заявка; ср. `rhaef_v2/agents/roboqc` |
| [Robo-QC-Mobile](https://github.com/aleksandrlyubarev-blip/Robo-QC-Mobile) | мобильный агент инспекции сборки | мобильный трек QC |
| [Enter-RoboQC-mobile](https://github.com/aleksandrlyubarev-blip/Enter-RoboQC-mobile.) | мобильная версия RoboQC | мобильный трек QC |
| [Brigada](https://github.com/aleksandrlyubarev-blip/Brigada) | «Army of agents 0.8→253B» | полная версия `roboqc_data/brigada` |
| [Andrew-Analitic](https://github.com/aleksandrlyubarev-blip/Andrew-Analitic) | AI-агент аналитики данных | = «Andrew Swarm» |
| [Bassito](https://github.com/aleksandrlyubarev-blip/Bassito) | мульт-аниматор | = «Bassito Video» |
| [Buxter](https://github.com/aleksandrlyubarev-blip/Buxter) | CAD-агент | не в ростере |
| [Romeo_PHD](https://github.com/aleksandrlyubarev-blip/Romeo_PHD) | архитектура AI-агента | = «Romeo Prime» |
| [miranda-rfv](https://github.com/aleksandrlyubarev-blip/miranda-rfv) | видео-реставрация (RFV) | полная версия `scripts/rfv_pipeline` |
| [NeuroPool-Context-Engine-](https://github.com/aleksandrlyubarev-blip/NeuroPool-Context-Engine-) | CLI-агент эффективного токен-юза | биллинг/контекст |
| [Evolution_lab](https://github.com/aleksandrlyubarev-blip/Evolution_lab) | лаборатория эволюции (R&D) | private |
| [Pino_cut](https://github.com/aleksandrlyubarev-blip/Pino_cut) | нарезка видео | источник легаси `sync-scene-ops` |

# RoboQC Agents (testbed)

6-ролевой pipeline полигона RoboQC (см. `rhaef_v2/agents/roboqc/`). По умолчанию
роутятся через `ModelRouter` в локальный SGLang (`SGLANG_BASE_URL`); fallback — облачный qwen.

- Vision Perception     → Qwen3-VL-8B (local SGLang :30002)
- Scene Understanding   → Qwen 3.6-35B-A3B (local SGLang :30000)
- Reasoning Planner     → Qwen 3.6-35B-A3B или Gemma 4 31B (в bench-режиме)
- RoboQC Specialist     → Qwen 3.6-35B-A3B (промпты + few-shot по классу дефекта)
- Action & Robot Command Generator → Qwen 3.6-35B-A3B (строгий JSON в ActionCommand)
- Critic / Verifier     → Qwen 3.6-35B-A3B (retry-луп в planner)

Промпты: `roboqc_data/src/roboqc_data/prompts/templates/*.j2`. Состояние: `RoboQCState`
(Pydantic v2). Ручной прогон: `python -m rhaef_v2.agents.roboqc.cli run --image PATH`.
