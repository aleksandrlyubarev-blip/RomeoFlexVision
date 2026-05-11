# Архитектура RHAEF v2

## Core Principles
- Agent-legible codebase (Pydantic v2, strict typing, zero magic)
- Intentional friction в critical nodes
- Model Router с жёстким категорированием задач
- Hybrid execution (cloud + local GCP)

## Model Strategy (май 2026)
- Critical / Architecture / Coding → anthropic/claude-opus-4-7
- Vision / Execution → openai/gpt-5.5-pro
- Orchestration / Video → xai/grok-4
- Volume → qwen/qwen3.6-plus

## Friction Gates
Каждое критическое решение требует human approval (Romeo Prime).

## LangGraph
Stateful graph: romeo_prime → claude_coder → tools → back to romeo_prime
