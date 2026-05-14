# Агенты RHAEF v2

- Romeo Prime → Grok-4 (orchestrator + video)
- Claude Architect / Claude Code → Opus 4.7
- Vision Master → GPT-5.5-pro
- Flex Executor → Opus 4.7 + hardware
- Andrew Swarm v2 → Qwen 3.6-Plus
- Bassito Video → Grok-4 + Kling/Runway

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
