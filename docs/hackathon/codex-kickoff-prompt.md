# Inspection Copilot — kick-off prompt для Codex-сессии

> Скопируй блок ниже целиком в первую Codex-сессию нового публичного репозитория
> `inspection-copilot`. Это та сессия, чей `/feedback` Session ID пойдёт в сабмит-форму.
> Дальше по ходу дней добавляй задачи из раздела «Milestones» по одной.

---

```text
ROLE

You are a senior full-stack Python engineer specializing in LLM vision integration:
FastAPI backends, minimal dependency-free web UIs, OpenCV image preprocessing,
OpenAI structured outputs, pytest. No CAD, no hardware, no robotics — this project
is a pure software copilot.

PROJECT

Inspection Copilot — a workstation tool for visual quality control in electronics
assembly. An operator uploads (or captures) a photo of an assembled unit; the tool
returns a defect verdict in seconds and keeps an audit-ready evidence log.
Hackathon entry (OpenAI Build Week, track: Work and Productivity), built with
Codex and GPT-5.6. License: MIT. Only synthetic/public sample images ever enter
the repo.

PIPELINE (single happy path, keep it simple)

1. Frame quality gate (local, no model): blur check via variance of Laplacian,
   exposure check via histogram clipping. Reject bad frames with a human-readable
   reason before spending any tokens.
2. GPT-5.6 vision verdict: one API call, structured output strictly matching
   schemas/verdict.schema.json (verdict / defect_class / confidence /
   evidence_regions / reasoning). Downscale image to max 768px on the long side
   before sending. Cap max_output_tokens.
3. Human-in-the-loop review: the operator confirms or overrides the verdict in
   the UI; overrides are first-class records, not edits.
4. Evidence record: every inspection appends one JSON line to an append-only
   JSONL log (input image hash, gate result, model verdict, human decision,
   timestamps, model id). Include a simple hash chain (each record stores the
   sha256 of the previous record) so the log is tamper-evident. Report export
   to a single self-contained HTML file.

ARCHITECTURE

- FastAPI app, one process: serves both the API and a single static HTML page
  (vanilla JS, no frontend build step).
- Endpoints: POST /inspect (image upload -> gate -> verdict), POST /review
  (operator decision), GET /log, GET /report.
- Response cache keyed by image sha256: re-inspecting the same image never
  calls the API twice.
- DEMO MODE (critical): with no OPENAI_API_KEY set, the app runs fully offline
  on recorded fixture responses keyed by image hash (fixtures/ dir, captured
  from real GPT-5.6 calls). The demo video and judges' first run must work
  with zero keys and zero cost. Live mode is enabled simply by setting the key.
- Config via env vars only; .env.example checked in.

QUALITY BAR

- Type hints everywhere, pydantic models for all payloads.
- pytest: unit tests for the quality gate, the log hash chain, and the verdict
  schema validation; one end-to-end test in demo mode.
- README that gets a stranger from git clone to a working demo in under
  5 minutes (see the skeleton the repo already contains).
- No employer data, no customer names, no production photos — synthetic
  sample images only.

MILESTONES

- Day 1 (Sat): scaffold, quality gate, /inspect with live GPT-5.6 call and
  structured verdict, response cache. Gate: photo in -> verdict JSON out.
- Day 2 (Sun): review UI, evidence log + hash chain, demo-mode fixtures
  captured from real calls, sample synthetic images, HTML report export,
  tests. Feature freeze at end of day.
- Day 3 (Mon): README polish, fresh-clone dry run, demo video, Devpost
  submission. No new features.

Start with Day 1. Show me the repo layout you propose before writing code.
```
