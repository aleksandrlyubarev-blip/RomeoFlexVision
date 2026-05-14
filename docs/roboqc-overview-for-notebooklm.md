# RoboQC — брифинг для NotebookLM

> Этот документ — **source-контекст для NotebookLM**. Загрузите его в NotebookLM вместе со статьями, которые вы собрали, и попросите NotebookLM ответить на вопросы из секции **«Что мы хотим получить от обзора»** — это даст обзор инструментов, привязанный к нашему реальному стеку и открытым решениям, а не общий пересказ статей.
>
> Дата: май 2026. Версии в этом документе зафиксированы как **факты, проверенные через WebSearch**, а не догадки из тренировочных данных модели.

---

## 1. Что такое RoboQC

RoboQC — AI-layer для **visual quality control при сборке AI hardware** (GPU-сервера, racks, кабельные сборки, connector-узлы, liquid-cooling-фитинги). См. `docs/pitch-deck.md`.

**Проблема:** На AI-rack за $2–3M ошибка $5 connector-а становится катастрофой. Текущий QC — операторы с фонариком и Excel-чеклистом: медленно, непоследовательно, без evidence-trail, не AI-ready.

**Wedge — 11 pixel-level defect-классов** (плюс OK + WRONG_ROUTING как layout-level):
- **Screw:** missing / wrong_type / torque_visual (рассогласование witness-mark).
- **Cable:** wrong_port / not_seated / crossed.
- **Connector:** damage (bent pins, scratches) / not_seated.
- **Latch:** open / broken.
- **Routing:** wrong (жгут поверх hot-zone) — layout-level, без пиксельной маски.
- **Leak:** liquid cooling fittings.

**Архитектура deployment** (из pitch-deck slide 8):
- Edge inference на станции (<200 ms).
- Cloud reasoning для borderline cases.
- HITL approval (QC engineer console).
- Immutable evidence log → integration в QMS/MES.

---

## 2. Что уже построено

Все артефакты лежат в **двух репозиториях**:
- `aleksandrlyubarev-blip/RomeoFlexVision` — Python, ML/dataset infrastructure.
- `aleksandrlyubarev-blip/Romeo_PHD` — TypeScript/pnpm monorepo, оркестрация и HITL UI.

Активная ветка: `claude/roboqc-dataset-preparation-cUBoX` в обеих репах.

### 2.1 Подпакет `roboqc_data/` (RomeoFlexVision)

Изолированный подпакет с собственным `pyproject.toml` и CI; легко выносится в отдельный репо через `git subtree split`.

**Канонический Pydantic-v2 schema** (`schema/`):
- `DefectClass` / `DefectCategory` enum'ы покрывают всю wedge-taxonomy.
- `ImageRecord`, `Annotation` (с `provenance: human | grounded_sam2 | sam3 | brigada | auto`), `BBox`, `MaskRef`, `AnomalyHeatmapRef`, `StationContext` (хук под реальные плант-данные).
- `Manifest` с детерминированным `manifest_sha256` over sorted (record_id, sha256) пар — воспроизводимость на одном seed.
- `SplitSpec` — hash-based deterministic train/val/test assignment.

**Ingest-адаптеры** (`ingest/`) — каждый walk'ает pre-mounted root и эмитит канонический `Manifest`:
- `mvtec_ad` — MVTec AD (классика, оригинальная лицензия).
- `mvtec_ad_2` — **MVTec AD 2** (arXiv:2503.21622, IJCV 2026): 8 более сложных сценариев, SOTA сидит <60 % AU-PRO; правильный «честный» бенчмарк сейчас.
- `mvtec_loco` — MVTec LOCO (logical vs structural anomalies).
- `visa` — VisA (Amazon Spot-Diff, CC-BY-4.0).
- `isp_ad` — ISP-AD (real + synthetic mix, arXiv:2503.04997).
- `pku_pcb` — PKU-Market-PCB (6 native классов PCB defects).
- License registry с `redistributable / commercial_use` флагами на каждом записанном `SourceInfo`.

**Brigada synthetic generator** (`brigada/`) — multi-agent система по спецификации `docs/brigada-architecture.md`:
- Иерархия Protocol-агентов: **General** (CRITICAL, 70B-class) → **Major** (ARCHITECTURE) → **Sergeant** (CODING, 2–4B) → **Soldier** (ROUTINE, 0.8–1.5B).
- Две реализации каждой роли: **HeuristicXxx** (детерминированный, default) и **RouterBackedXxx** (через `rhaef_v2.core.model_router.ModelRouter` + LangSmith tracing + fallback модели). LiteLLM под капотом.
- **FrictionGate** для high-risk классов (LEAK, WRONG_ROUTING) и батчей ≥100.
- **CV-слой** (`brigada/cv_layer/`): 11 pixel-level `DefectTransform`-ов (по одному файлу на класс), каждый возвращает `(rgb_uint8, binary_mask)`. OpenCV + Albumentations, seeded determinism.
- `BrigadaSynthesizer.generate(SynthRequest)` → `SynthResult` с canonical Manifest.

**Label-assist** (`label_assist/`) — **bootstrap-only, never runtime**:
- `LabelAssistBackend` Protocol.
- **Default: `Sam3Backend`** (SAM 3, Meta, ноя 2025, arXiv:2511.16719 / SAM 3.1, мар 2026). Promptable Concept Segmentation: text-prompt → bbox + mask + confidence за один forward pass.
- Fallback: `StubGroundedSAM2Backend` для CI без сети/весов.
- `LabelAssistant.propose(image_dir, prompts)` → JSONL queue для human review.

**Train-адаптеры** (`train/`) — тонкие обёртки с import-guard:
- `AnomalibAdapter` (PatchCore / EfficientAD) — `anomalib>=2.0` (v2.2.0 на 2026).
- `YoloAdapter` (det + seg) — default weights `yolo26n*` (Ultralytics YOLO26, янв 2026, NMS-free, end-to-end).
- `RTDETRAdapter` — default `ultralytics.RTDETR`; document'ированы опции на RT-DETRv4 (ноя 2025, Deep Semantic Injector + DINOv3-ViT-B), RT-DETRv3 (WACV 2025 Oral), RT-DETRv2 (HF transformers).
- Без extras → `TrainResult(status="skipped", notes="…")`, никаких импорт-ошибок на CI.

**Export** (`export_models/`):
- `ONNXExportAdapter` диспатчит на `yolo://` / `anomalib://` / `onnx://` URI-схемы.
- `TensorRTExportAdapter` шеллится в `trtexec`, иначе `skipped`.
- Целевой runtime: **NVIDIA DeepStream 9.0** + **TAO Toolkit 6.26.3** (свежие, Blackwell support).

**Manifest → trainer-native экспорт** (`export/`):
- COCO JSON, Ultralytics YOLO-seg layout (`data.yaml`), Anomalib Folder layout.

**CLI** (Typer): `roboqc-data ingest <name> --root … --out …`, `synth --target … --clean … --out …`, `export --manifest … --format coco|yolo_seg|anomalib`.

**Тесты:** **95 passed** (schema 8, ingest 9, ingest+ad2 3, export 4, export_models 5, cv_layer 7+33 параметризованных, brigada orch 3, router-backed 8, label-assist 3, SAM 3 3, train adapters 4, CLI 2, e2e smoke 2).

**CI:** GitHub Actions с **тремя** workflow'ами: `roboqc_data` (PR-tests на `[cv,brigada]`), `roboqc_data_lint` (ruff check + format), `roboqc_data_nightly` (cron 03:17 UTC, ставит все `[cv,brigada,train,export]` extras).

### 2.2 Интеграция с `rhaef_v2/` (RomeoFlexVision)

Существующий agentic framework (LangGraph + LiteLLM + Pydantic v2 strict).

- `tools/interfaces.py`: `InspectionRequest`, `InspectionResult`, `DetectedDefect` Pydantic-модели; `RoboQCClient` async Protocol; `StubRoboQCClient` возвращает структурированный результат.
- `core/graph.py`: `roboqc_stub` теперь возвращает JSON-сериализованный `InspectionResult` через `StubRoboQCClient`.
- `api/routes.py`: новые endpoint'ы `GET /dataset/manifest/{id}` (license + class breakdown), `POST /dataset/synth/preview` (dry-run record-id enumeration), `POST /inspect` (через `StubRoboQCClient`).

### 2.3 Romeo_PHD (TypeScript pnpm-workspace)

HITL-консультации и evidence-store для inspection-driven flow:
- **Drizzle schema** `inspections` table (id, inspection_id unique, image_uri, overall_pass, confidence, model_version, requires_hitl, defects jsonb, hitl_consultation_id nullable FK → consultations.id).
- `consultations.pipelineId` → **nullable** (raw inspections не имеют parent pipeline; pipeline-driven path не задет, потому что pipelineId всегда передаётся в существующем коде).
- `POST /api/inspections` route принимает `InspectionResult`, при `requires_hitl=true || confidence < 0.85` материализует строку в `consultations` с полным defects-payload в `arguments`. `GET /api/inspections/:id` — fetch by external id.

---

## 3. Текущий стек (зафиксировано на май 2026 через WebSearch)

| Слой | Выбор | Версия | Дата релиза | Альтернативы под review |
|---|---|---|---|---|
| Label-assist (bootstrap) | **SAM 3 / SAM 3.1** | 3.1 Object Multiplex | 20 ноя 2025 / 27 мар 2026 | Grounded SAM 2 (legacy fallback) |
| Anomaly detection (unsupervised) | **Anomalib** | v2.2.0 | 2026 | PatchCore / EfficientAD внутри Anomalib |
| Supervised detector | **Ultralytics YOLO26** | yolo26n-seg.pt | 14 янв 2026 | YOLO11, RT-DETRv4 |
| Real-time transformer detector | RT-DETR baseline | CVPR 2024 | — | **RT-DETRv4** (18 ноя 2025, DINOv3-ViT-B), RT-DETRv3 (WACV 2025 Oral), RT-DETRv2 (HF) |
| Synthetic data | **Brigada (свой)** | — | — | Training-Free diffusion (ICCV 2025), ISP-AD |
| Edge runtime | **DeepStream 9.0** + **TAO 6.26.3** | DS 9.0 / TAO 6.26.3 (апр 2026) | — | Triton, ONNX Runtime |
| Dataset / benchmark | **MVTec AD 2** | IJCV 2026 (arXiv:2503.21622) | 2026 | MVTec AD, VisA, ISP-AD, PKU-PCB |
| Defect explanation | (не выбран) | — | — | **VELM**-style multimodal LLM (CVPRW 2025) |
| Model router | rhaef_v2 ModelRouter | LiteLLM + Opus/Grok/GPT-5.5/Qwen | май 2026 | — |

---

## 4. Архитектурные принципы (важно для NotebookLM при отборе инструментов)

1. **Edge-first, cloud-second.** Линия не ждёт облако. Любой выбранный инструмент должен иметь deterministic-latency путь до Jetson-класса.
2. **Bootstrap-only label assist.** SAM-семейство — для разметки, не для inference на конвейере. На станции — distilled production model.
3. **HITL обязателен.** Borderline cases уходят QC-инженеру через `consultations`. Любая модель должна экспортировать `confidence` + `requires_hitl` сигнал.
4. **Evidence-log в первую очередь.** Даже до 99 % AI accuracy traceability продаваема. Любой инструмент должен сохранять crop + provenance.
5. **Pydantic v2 strict.** Все интерфейсы — Protocol/ABC, frozen Pydantic-модели, FrictionGate на critical путях.
6. **Изоляция dependencies.** Heavy ML deps (torch / ultralytics / anomalib / sam3) — в extras, не в core. Skipping-fallback на import-guard, не runtime crash.

---

## 5. Что мы хотим получить от обзора (вопросы к NotebookLM)

Загрузите в NotebookLM ваши статьи + этот файл и попросите ответить на эти вопросы. Каждый вопрос привязан к нашему решению или открытой точке стека.

### Группа A — label-assist и open-vocabulary segmentation
1. **SAM 3 vs SAM 3.1 vs DINOv3+SAM 2 на industrial concept segmentation:** какие из ваших статей численно сравнивают эти варианты на defect-like объектах (small / dense / low-contrast)? Какой выигрыш по AP / AU-PRO и какие компромиссы по latency / VRAM?
2. **Text-prompt инженерия для SAM 3:** есть ли best-practice по формулировке промптов для industrial defect lexicon ("bent pin" vs "deformed connector lead" vs "pin out of alignment")? Что повышает recall на rare-defect случаях?
3. **Distillation SAM 3 → меньшая модель для edge:** какие подходы описаны? Можно ли получить sub-100ms inference на Jetson Orin при сохранении >85 % concept-IoU?

### Группа B — supervised detector / segmenter
4. **YOLO26 vs RT-DETRv4 на PCB-like и connector-defect benchmarks:** какие реальные числа AP/recall-at-low-FP / latency на современных GPU и Jetson? Когда RT-DETRv4 строго лучше YOLO26 и наоборот?
5. **NMS-free inference (YOLO26 end-to-end) при borderline confidences:** как ведёт себя при перекрывающихся defect-instances (несколько bent pins подряд)? Стоит ли откатываться на NMS-варианты для line-конкретных кейсов?
6. **Mask-export pipeline для YOLO-seg → DeepStream 9.0:** какие правильные ONNX/TensorRT-флаги при экспорте, чтобы маски не теряли точность? Готовые рецепты в свежих статьях/блогах?

### Группа C — anomaly detection
7. **Anomalib v2.2 PatchCore vs EfficientAD на MVTec AD 2:** свежие числа AU-PRO на 8 новых сценариях. Какие методы (из ваших статей) первыми перешагнут 60 % barrier?
8. **Когда anomaly detection >> supervised:** при каком соотношении good/defective samples и какой variance defective-распределения unsupervised anomaly строго предпочтительнее supervised YOLO/RT-DETR?
9. **Multi-modal anomaly (RGB + 3D или RGB + thermal):** есть ли статьи, релевантные для liquid-cooling leak detection (LEAK класс — это thermal-related)?

### Группа D — synthetic data generation
10. **Diffusion-based defect generation vs brigada-стиль (LLM + CV layer):** на каких задачах diffusion даёт лучший downstream AP, на каких — алгоритмический CV-слой? Численные ablations.
11. **ISP-AD (real + synthetic) recipe:** какое оптимальное соотношение real:synthetic для plateau performance? Когда synthetic перестаёт помогать?
12. **Domain randomization для industrial defects:** lighting / texture / camera angle — какие axes критичны, какие — noise? Что показывают свежие papers'ы про generalization gap.

### Группа E — multimodal explanation + HITL
13. **VELM-style "detect + classify + act" pipelines:** какие конкретные multimodal LLM на май 2026 best для defect explanation поверх crops? Latency / cost на report?
14. **HITL confidence-thresholding:** какие свежие методы калибровки уверенности (conformal prediction, evidential learning) релевантны для нашего 0.85 cutoff?

### Группа F — edge deployment
15. **DeepStream 9.0 + TAO 6.26.3 pipeline для multi-camera inspection cell:** свежие reference-архитектуры, ROI-per-camera, event-logging best practices?
16. **TensorRT optimisation для YOLO26 / RT-DETRv4:** какие свежие numbers по FPS / latency / memory на Jetson Orin Nano / NX / AGX? Какие потери AP при FP16 / INT8?

### Группа G — datasets и бенчмарки
17. **Какие свежие dataset'ы за 2025–2026** заслуживают добавления в `roboqc_data/ingest/` кроме уже подключённых (MVTec AD/AD 2/LOCO, VisA, ISP-AD, PKU-PCB, DAGM)? Особенно интересны: cable harness, liquid cooling, server-assembly специфика.
18. **Sim-to-real benchmarks:** есть ли свежие public datasets, где помечены sim-trained models на реальных fab-данных?

---

## 6. Формат, в котором мы ждём ответ от NotebookLM

Для каждого пункта в секции 5 NotebookLM должен дать:

1. **Tooling recommendation** — какой инструмент / модель / dataset из статей нам брать (или какие комбинации). Явно: "взять X" / "не брать X" / "ждать публикации Y".
2. **Цифры**, где источники их приводят (AP, AU-PRO, FPS, VRAM, latency, sample-efficiency).
3. **Точки риска** — если статья что-то заявляет, но методология вызывает вопросы (small benchmark, лимит на одном domain, etc.).
4. **Привязка к нашему коду** — какой файл в `roboqc_data/` затронут (например, "обновить `train/yolo_adapter.py:DEFAULT_SEG_WEIGHTS`" или "добавить новый `ingest/<name>.py` адаптер").

Цель: после этого обзора у нас есть **список конкретных PR-задач**, привязанных к ссылкам.

---

## 7. Кратко для копирования в первое сообщение NotebookLM

```
Загружены: этот брифинг + статьи. Дай по каждому вопросу из секции 5
обзор инструментов в формате из секции 6 (recommendation, цифры, риски,
привязка к нашему коду). Ничего не пересказывай — выдавай только то,
что прямо вытекает из загруженных статей или явно ими опровергается.
Если статья по вопросу ничего не говорит — так и пиши "статьи не
покрывают этот вопрос". Не выдумывай числа.
```
