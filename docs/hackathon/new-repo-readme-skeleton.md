# README-скелет для нового репозитория `inspection-copilot`

> Скопировать в новый репо как `README.md` и заполнить `TODO`-места по ходу.
> Секции «How Codex was used» и «How GPT-5.6 was used» — судейский критерий,
> заполнять реальными эпизодами из сессий, не общими словами.

---

```markdown
# Inspection Copilot

AI copilot for visual quality control in electronics assembly. Upload a photo
of an assembled unit — get a defect verdict in seconds, review it as an
operator, and keep an audit-ready, tamper-evident evidence log.

Built with **Codex** and **GPT-5.6** for OpenAI Build Week 2026
(track: Work and Productivity).

**Demo video:** TODO YouTube link

## Quickstart (demo mode — no API key, no cost)

    git clone TODO-repo-url
    cd inspection-copilot
    pip install -r requirements.txt
    python -m inspection_copilot
    # open http://localhost:8000 and try the images in sample_data/

Demo mode runs fully offline on recorded GPT-5.6 responses (fixtures/),
so the full flow — quality gate, verdict, operator review, evidence log,
report export — works with zero configuration.

## Live mode

    cp .env.example .env   # set OPENAI_API_KEY
    python -m inspection_copilot

Live mode calls GPT-5.6 vision with a strict structured-output schema
(schemas/verdict.schema.json). Responses are cached by image hash, images
are downscaled to 768px before sending, output tokens are capped — a full
demo session costs cents.

## How it works

1. **Frame quality gate** (local, no model) — blur and exposure checks reject
   unusable photos before any tokens are spent.
2. **GPT-5.6 verdict** — one vision call returns
   `verdict / defect_class / confidence / evidence_regions / reasoning`;
   evidence regions are drawn on the photo in the UI.
3. **Operator review** — confirm or override; overrides are first-class records.
4. **Evidence log** — append-only JSONL with a sha256 hash chain
   (tamper-evident); one-click self-contained HTML report.

## How Codex was used

TODO: 3-5 concrete episodes, e.g.:
- Scaffolded the FastAPI app and UI from the kick-off spec in one session.
- TODO: a key decision Codex drove (name the alternative it rejected and why).
- TODO: tests/bug Codex caught.
- Main-session `/feedback` ID: submitted via the Devpost form.

## How GPT-5.6 was used

- **Development time:** the model behind every Codex session that built this repo.
- **Runtime:** the inspection engine itself — GPT-5.6 vision with structured
  outputs produces every verdict; the recorded demo fixtures are captured
  real GPT-5.6 responses.

## Sample data

`sample_data/` contains synthetic images only (TODO: how they were generated).
No real production, customer, or employer photos are included.

## Tests

    pytest

## License

MIT
```
