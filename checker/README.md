# NeutronVision Checker

> macOS desktop demo for industrial QC photo inspection of HPC liquid-cooling components, powered by xAI Grok vision.

NeutronVision Checker is a one-screen PyQt6 app that turns a USB camera + a single
`SPACE` keypress into:

1. A **quality-gated capture** (sharpness / exposure / framing scored in real time).
2. A **VLM verdict** (PASS / FAIL / RETAKE) from xAI Grok vision.
3. A **session-scoped artifact** on disk: full-res JPEG + thumbnail + per-capture
   JSON + a multi-page PDF summary.

It exists to support pitch demos and as an open-source reference application on
top of the [NeutronVision QC](https://github.com/aleksandrlyubarev-blip/romeoflexvision)
stack. **It is not a certified QC tool.**

---

## Status

| Area | v0.1 (this release) | v0.2 (next) |
|---|---|---|
| Live camera preview | ✅ | — |
| Real-time quality bars | ✅ | — |
| Capture → JPEG + JSON | ✅ | — |
| AI verdict via xAI Grok | ✅ | — |
| Session summary PDF | ✅ | — |
| Local MLX Gemma engine | _coming soon_ (UI shows it disabled) | ✅ |
| SAM 3 / Florence-2 segmentation overlay | — | ✅ |
| Multi-camera | — | ✅ |
| Auth / multi-user | — | _out of scope_ |

---

## System requirements

- macOS 14.5+ (Sonoma) or 15.x (Sequoia)
- Apple Silicon (M-series) Mac with ≥16 GB unified memory
- USB UVC camera (the build-of-materials reference is an IMX415 4K UVC box camera with a CS-mount varifocal and ring light)
- Python 3.11
- xAI API key (sign up at https://x.ai/api)

The app should also run on Linux for development with a UVC camera, but the
camera backend is selected for AVFoundation.

---

## Installation (≤ 15 minutes)

```bash
git clone https://github.com/aleksandrlyubarev-blip/romeoflexvision.git
cd romeoflexvision/checker
python3.11 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
```

Create `~/NeutronVision/secrets.env` and put your Grok key inside:

```bash
mkdir -p ~/NeutronVision
printf "GROK_API_KEY=xai-your-key-here\n" > ~/NeutronVision/secrets.env
chmod 600 ~/NeutronVision/secrets.env
```

(The Settings dialog can also write this file for you; the entry just stays on
disk so you don't have to retype it on each launch.)

---

## Running

```bash
python main.py
```

The app opens a single window with the live camera feed on the left and the
quality / capture panels on the right. Plug in your USB camera before launch
and the default `camera_index = 0` should pick it up; otherwise change the
index in **Settings**.

Keyboard shortcuts:

| Key | Action |
|---|---|
| `SPACE` | Capture the current frame and submit it to the AI engine |
| `Ctrl+N` | Start a new session (asks for an optional name) |
| `Ctrl+E` | End the current session and write the summary PDF |

---

## Demo flow

1. Click **New Session** in the toolbar (or `Ctrl+N`) and type a name.
2. Position your sample in the central reticle. The three quality bars on the
   right turn green when the frame is good enough. The status badge shows
   `GOOD` / `WARN` / `BAD`.
3. Press `SPACE`. The preview flashes white for ~100 ms and the **Last
   capture** card on the right shows the saved thumbnail, "ANALYZING…", and
   then the Grok verdict (≤ 8 s typically).
4. Repeat for as many captures as you want — they all land in the same session
   directory.
5. Click **End Session** (or `Ctrl+E`) — a one-page-or-more summary PDF is
   written to the session directory and you get a confirmation dialog with
   the path.

---

## Output layout

```
~/NeutronVision/
├── config.json                    # camera index, engine, model id, thresholds
├── secrets.env                    # GROK_API_KEY=… (chmod 600)
├── logs/
│   └── checker_YYYYMMDD.log
└── sessions/
    └── 2026-05-19_1430_zutacore-demo/
        ├── session.json           # session metadata + capture list
        ├── 001_capture.jpg        # full-resolution capture
        ├── 001_thumbnail.jpg      # 256-px thumbnail
        ├── 001_capture.json       # quality + AI verdict JSON
        ├── 002_capture.jpg
        ├── …
        └── session_summary.pdf    # generated on End Session
```

---

## Architecture

```
            ┌──────────────────────────┐
   USB ───▶ │    CameraThread (QThread)│ frame_ready(bgr, ts) ──┐
            └──────────────────────────┘                         │
                                                                 ▼
                                ┌──────────────────────────┐    PreviewWidget
                                │  QualityWorker (QThread) │    (Qt main thread)
                                │  read-and-clear @ 5 Hz   │
                                └──────────────────────────┘    QualityPanel
                                            │
                                            ▼ quality_updated(QualityReport)

   user presses SPACE → SessionManager.add_capture()  ──▶  JPEG + JSON on disk
                                            │
                                            ▼ submit(capture_id, jpeg_path, prompt)
                                ┌──────────────────────────┐
                                │ InferenceWorker (QThread)│
                                │  GrokEngine.analyze()    │
                                └──────────────────────────┘
                                            │
                                            ▼ inference_done(capture_id, CaptureResult)
                                       CapturePanel
                                       SessionManager.attach_result()
```

Three background `QThread`s, all communicating with the GUI thread via
`Qt.ConnectionType.QueuedConnection` signals. The validator and AI engine
never run on the main thread, so the UI stays responsive even mid-inference.

For the full design rationale, see the planning notes in
`/root/.claude/plans/crystalline-floating-boot.md` (committed alongside the
code only as reference; not a runtime artifact) and the original Russian-
language TZ document.

---

## Configuration reference

`~/NeutronVision/config.json` (all fields optional; defaults shown):

```json
{
  "camera_index": 0,
  "target_fps": 30,
  "quality_hz": 5.0,
  "inference_max_side": 512,
  "engine": "grok",
  "grok_model": "grok-4.3",
  "grok_endpoint": "https://api.x.ai/v1/chat/completions",
  "grok_timeout_s": 15.0,
  "quality": {
    "sharpness_min": 0.5,
    "exposure_min": 0.5,
    "framing_min": 0.5,
    "all_must_pass": false
  }
}
```

---

## Troubleshooting

- **No camera detected.** Confirm the camera shows up in macOS *System
  Settings → Privacy & Security → Camera*. Try a different `camera_index` in
  Settings (0, 1, 2). The first frame after open often takes ~200 ms — the
  app's warmup loop already accounts for this.
- **Grok API 401.** Settings dialog → re-enter the key. The app will rewrite
  `~/NeutronVision/secrets.env` for you.
- **Verdict consistently `unknown`.** Check `~/NeutronVision/logs/checker_*.log`
  — if the response body is non-JSON, your `grok_model` may not support
  `response_format=json_object`. The engine falls back to regex extraction,
  but a clearly-instructed model id is the cleanest fix.
- **Slow inference (>10 s).** Lower `inference_max_side` from `512` to `384`
  to send a smaller image. The capture JPEG on disk is always full-resolution.

---

## Development

Run the sandbox-friendly test suite (no Qt, no camera):

```bash
ruff check checker tests
pytest -q
```

The suite covers the quality validator, session manager, PDF export, prompt
template, Grok engine (with monkeypatched `requests.post`), and settings
round-trip. UI and camera smoke tests are marked `@pytest.mark.macos` and
skip automatically off-platform.

---

## Roadmap

- **v0.2** — local MLX Gemma engine (no network needed for verdicts), multi-
  camera selector, capture history scrollable list.
- **v0.3** — SAM 3 segmentation overlay, Florence-2 grounding context fed back
  into the VLM prompt.
- **v0.4** — defect taxonomy training UI, session export to MES.

---

## License

MIT (matches the rest of the NeutronVision QC repo). See `LICENSE` at the
repository root.

---

## Related projects

- [`roboqc_data/`](../roboqc_data) — NeutronVision QC dataset preparation pipeline.
- NeutronVision QC commercial SKUs (NV1100–NV4100) are extensions on top of this
  reference application.
