# RoboQC — архитектура (май 2026)

Сборка всех уже построенных компонентов в один блок-диаграмм + перечень файлов. Дополняет `pitch-deck.md` (продуктовая сторона) и `brigada-architecture.md` (научная часть synthetic data).

## Полный inspection-pipeline

```
┌────────────────────────────────────────────────────────────────────────┐
│ STATION (edge — Jetson Orin NX или Luxonis OAK 4)                       │
│                                                                        │
│  Camera(s) → DeepStream 9.0 / OAK 4 firmware                            │
│            → YOLO26-seg (NMS-free) [primary]                            │
│            → PatchCore-Lite / Tiny-Dinomaly [secondary, anomaly]        │
│            → Live operator feedback (<200 ms)                           │
└──────────────────────────────┬─────────────────────────────────────────┘
                               │  InspectionResult JSON
                               ▼
┌────────────────────────────────────────────────────────────────────────┐
│ CLOUD REASONING (rhaef_v2 ModelRouter, LiteLLM, LangSmith)              │
│                                                                        │
│  POST /inspect                                                          │
│    → VelmRoboQCClient.run_check                                         │
│      → VelmPipeline.run                                                 │
│         → VisualExpert (Anomalib heatmap → ROI crops)                   │
│         → RouterBackedVlmClassifier per crop                            │
│           [TaskCategory.VISION, GPT-5.5-pro / Opus 4.7]                 │
│         → VelmResult                                                    │
│      → InspectionResult (defects + confidence + requires_hitl)          │
│                                                                        │
│  POST /inspect/logical (logical / layout-level path)                    │
│    → LogicQaChecker.synthesise (1–3 refs → checklist)                   │
│    → LogicQaChecker.inspect (test image vs checklist)                   │
│    → LogicQaResult (provenance="logic_qa")                              │
└──────────────────────────────┬─────────────────────────────────────────┘
                               │  if requires_hitl
                               ▼
┌────────────────────────────────────────────────────────────────────────┐
│ HITL APPROVAL (Romeo_PHD)                                               │
│                                                                        │
│  POST /api/inspections                                                  │
│    → INSERT into inspections (Drizzle)                                  │
│    → If requires_hitl or confidence < 0.85:                             │
│        INSERT into consultations (pipelineId nullable)                  │
│    → QC engineer reviews, approves/rejects, feedback recorded           │
└──────────────────────────────┬─────────────────────────────────────────┘
                               │
                               ▼
┌────────────────────────────────────────────────────────────────────────┐
│ EVIDENCE LOG ←→ QMS / MES ←→ Customer audit                             │
│                                                                        │
│  Immutable per-inspection record: photo before/after, station_id,      │
│  operator_id, work_order, issue_type, confidence, decision.            │
└────────────────────────────────────────────────────────────────────────┘
```

## Параллельный data-loop (под капотом)

```
┌────────────────────────────────────────────────────────────────────────┐
│ DATASET PREPARATION (roboqc_data subpackage)                            │
│                                                                        │
│  Public benchmarks:                                                     │
│    MVTec AD / MVTec AD 2 / MVTec LOCO / VisA / ISP-AD / PKU-PCB /       │
│    Real-IAD D3 — ingest/<name>.py → canonical Manifest (JSONL)          │
│                                                                        │
│  Synthetic:                                                             │
│    brigada.BrigadaSynthesizer (General → Major → Sergeant → Soldier)    │
│      → 11 pixel-level DefectTransform per wedge class                   │
│      → canonical Manifest                                               │
│                                                                        │
│  Label-assist (bootstrap-only):                                         │
│    SAM 3 / 3.1 Sam3Backend                                              │
│      → text-prompt → bbox + mask → ImageRecord(provenance="sam3")       │
│                                                                        │
│  SSL pre-train (optional step 0):                                       │
│    train.dinov2_ssl_adapter on plant-bucket Records                     │
│      → adapted backbone for downstream YOLO/RT-DETR fine-tune           │
│                                                                        │
│  Supervised train:                                                      │
│    train.yolo_adapter (YOLO26-seg default)                              │
│    train.rtdetr_adapter (RT-DETR baseline + v2/v3/v4 options)           │
│    train.anomalib_adapter (PatchCore/EfficientAD + edge variants)       │
│    train.anomaly_dino_adapter (training-free DINOv2 few-shot)           │
│                                                                        │
│  Domain adapt (optional):                                               │
│    adapt.mmd.MMDDomainAdapter — add to task loss for plant drift        │
│                                                                        │
│  Export:                                                                │
│    export_models.onnx_export        → ONNX                              │
│    export_models.tensorrt_export    → TensorRT engine                   │
│    export_models.luxonis_oak        → OAK 4 .nnarchive                  │
└────────────────────────────────────────────────────────────────────────┘
```

## Файлы по слоям

### Schema + ingest
- `roboqc_data/src/roboqc_data/schema/`
  - `taxonomy.py` — `DefectClass` enum (11 pixel-level + OK + WRONG_ROUTING).
  - `records.py` — `ImageRecord`, `Annotation`, `Manifest`, `Provenance` (`human` / `sam3` / `grounded_sam2` / `brigada` / `logic_qa` / `velm` / `auto`).
  - `splits.py` — deterministic hash-based split assignment.
  - `hashing.py` — order-independent manifest digest.
- `roboqc_data/src/roboqc_data/ingest/` — 7 dataset adapters + license registry.

### Synthetic generation (brigada)
- `roboqc_data/src/roboqc_data/brigada/`
  - `orchestrator.py` — `BrigadaSynthesizer.generate`.
  - `hierarchy.py` — Plan / SubPlan / ToolCall / ValidationOutcome models.
  - `agents/` — Heuristic{General,Major,Sergeant,Soldier} + `router_backed.py` (4 LLM-routed roles).
  - `cv_layer/` — 11 pixel-level `DefectTransform` (1 per pixel-level class) + `registry.py`.
  - `prompts.py` — system prompts for each role.

### Label-assist
- `roboqc_data/src/roboqc_data/label_assist/`
  - `grounded_sam2.py` — Protocol + StubGroundedSAM2Backend (CI).
  - `sam3.py` — Sam3Backend (Meta SAM 3 / 3.1, default).
  - `review_export.py` — JSONL queue для QC engineer console.

### Logical anomalies + VELM
- `roboqc_data/src/roboqc_data/logic/`
  - `logic_qa.py` — Heuristic + RouterBacked LogicQa (WRONG_ROUTING class).
  - `velm.py` — VisualExpert + VlmClassifier + VelmPipeline.

### Training
- `roboqc_data/src/roboqc_data/train/`
  - `base.py` — TrainAdapter Protocol.
  - `anomalib_adapter.py` — Anomalib (PatchCore / EfficientAD / *-Lite / Tiny-Dinomaly).
  - `anomaly_dino_adapter.py` — training-free AnomalyDINO.
  - `yolo_adapter.py` — Ultralytics YOLO26 (default), YOLO11/v8 selectable.
  - `rtdetr_adapter.py` — RT-DETR (v2/v3/v4 options documented).
  - `dinov2_ssl_adapter.py` — NV-DINOv2 SSL pre-train on plant Records.

### Adapt
- `roboqc_data/src/roboqc_data/adapt/`
  - `mmd.py` — Multi-bandwidth Gaussian MMD + `MMDDomainAdapter`.

### Export
- `roboqc_data/src/roboqc_data/export/` — `coco.py`, `yolo_seg.py`, `anomalib_folder.py`.
- `roboqc_data/src/roboqc_data/export_models/` — `onnx_export.py`, `tensorrt_export.py`, `luxonis_oak.py`.

### Deploy
- `roboqc_data/src/roboqc_data/deploy/deepstream_inspection_cell.yaml` — 2-camera DeepStream 9.0 reference template.

### Inspection
- `roboqc_data/src/roboqc_data/inspection_client.py` — `VelmRoboQCClient` + `build_velm_api_services` factory.

### rhaef_v2 integration
- `rhaef_v2/tools/interfaces.py` — `InspectionRequest`, `InspectionResult`, `DetectedDefect`, `RoboQCClient` Protocol, `StubRoboQCClient`.
- `rhaef_v2/api/routes.py` — `/inspect`, `/dataset/manifest/{id}`, `/dataset/synth/preview`.

### Romeo_PHD integration
- `Romeo_PHD/lib/db/src/schema/inspections.ts` — Drizzle `inspections` table.
- `Romeo_PHD/lib/db/src/schema/pipelines.ts` — `consultations.pipelineId` nullable.
- `Romeo_PHD/artifacts/api-server/src/routes/inspections/index.ts` — `POST /api/inspections` materializes HITL consultations row.

### CLI
- `roboqc_data/src/roboqc_data/cli/main.py` — `ingest`, `synth`, `export`, `velm`, `logic-qa`.

## Тесты + CI

- `roboqc_data/tests/` — **126+ тестов** (schema, ingest x8, brigada x12+33 параметризованных, cv_layer x10+, export x4, export_models x5, label_assist x3, SAM 3 x3, train adapters x4, AnomalyDINO/Anomalib edge x4, LogicQA x4, VELM x6, VelmRoboQCClient x6, DinoV2 SSL x1, MMD x3, Luxonis OAK x3, Real-IAD D3 x2, MVTec AD 2 x3, CLI x4, e2e smoke x2). Запуск на `[cv,brigada]` extras.
- `RomeoFlexVision/tests/` — 16/16, включая `tests/test_roboqc_routes.py` для `/inspect` / `/dataset/manifest` / `/dataset/synth/preview`.
- CI: 3 workflow'а — `roboqc_data` (PR), `roboqc_data_lint` (ruff), `roboqc_data_nightly` (full extras + cron).

## Production-readiness checklist

| Слой | Готово | Что осталось |
|---|---|---|
| Canonical schema | ✅ | — |
| Ingest 7 datasets | ✅ | Download-helper'ы (сейчас expect mounted root) |
| Brigada synthetic (11 transforms) | ✅ | Реальные plant-images для FrictionGate сценариев |
| Label-assist SAM 3 / 3.1 | ✅ | Реальные weights загрузить |
| Train adapters (Anomalib v2, YOLO26, RT-DETR, AnomalyDINO, DinoV2 SSL) | ✅ skeletons | Pilot-данные + GPU |
| Domain adapt (MMD) | ✅ skeleton | Wire в YOLO/RT-DETR train loop |
| Export (ONNX/TRT/OAK) | ✅ skeletons | Реальные модели для FP16/INT8 fine-tune |
| LogicQA / VELM | ✅ | Production VLM provider (через rhaef_v2 ModelRouter) |
| VelmRoboQCClient | ✅ | Plug-in в production rhaef_v2 deployment |
| HITL (Romeo_PHD) | ✅ | UI для inspection-консультаций в Romeo_PHD console |
| DeepStream pipeline | ✅ template | Реальный pilot на станции |
