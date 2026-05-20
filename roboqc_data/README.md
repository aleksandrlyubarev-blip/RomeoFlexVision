# roboqc_data

RoboQC dataset preparation subpackage. Lives inside the RomeoFlexVision monorepo but is logically standalone — has its own `pyproject.toml`, CI job, and is intended to be split out into a dedicated repository via `git subtree split` once GitHub scope allows.

For the full block-diagram of how every module fits together see `RomeoFlexVision/docs/architecture.md`.

## What it does

- **Ingest** public industrial-defect benchmarks into a canonical Pydantic-v2 manifest — 7 adapters: MVTec AD, **MVTec AD 2** (2026 successor, 8 harder scenarios), MVTec LOCO, VisA, ISP-AD, PKU-PCB, **Real-IAD D3** (2D + 3D point cloud + photometric stereo).
- **Synthesise** defects via the `brigada` multi-agent pipeline (`docs/brigada-architecture.md`): LLM agents (General → Major → Sergeant → Soldier, heuristic *or* router-backed) plan, a deterministic OpenCV/Albumentations layer with 11 per-class `DefectTransform`s executes.
- **Label-assist** with SAM 3 / SAM 3.1 (bootstrap-only) — one text prompt → bbox + mask + confidence. `StubGroundedSAM2Backend` is the CI fallback.
- **Train** adapters: Anomalib v2 (PatchCore / EfficientAD / *-Lite / Tiny-Dinomaly edge variants), Ultralytics YOLO26, RT-DETR (v2/v3/v4 selectable), AnomalyDINO (training-free), NV-DINOv2 SSL pre-training.
- **Domain-adapt** for plant drift via MMD regularisation (`adapt/mmd.py`).
- **Detect logical anomalies** (the `WRONG_ROUTING` class) with LogicQA, and run the VELM hybrid pixel-expert + VLM-classifier pipeline (`logic/`).
- **Calibrate HITL routing** with split-conformal prediction (`calibration/conformal.py`) — valid 1−α coverage instead of a hard-coded threshold.
- **Export** trained models to ONNX, TensorRT, and Luxonis OAK `.nnarchive` (`export_models/`).
- **Render deploy templates** for NVIDIA DeepStream 9.0 and Triton Inference Server into runtime config files (`deploy/`).
- **Inspect** through `VelmRoboQCClient`, a drop-in `rhaef_v2` `RoboQCClient` that turns a VELM run into an `InspectionResult`.

## Install

```bash
pip install -e .[cv,brigada]                  # core dev surface (schema + ingest + brigada + logic + calibration)
pip install -e .[cv,brigada,label_assist]     # add SAM 3 label-assist (needs CUDA + weights)
pip install -e .[cv,brigada,train]            # add training adapters (heavy)
pip install -e .[cv,brigada,train,export]     # add ONNX/TensorRT export
```

## CLI

```bash
roboqc-data ingest mvtec_ad_2 --root <path> --out manifest_dir/      # 7 datasets supported
roboqc-data synth --target screw_missing --count 3 --clean <image> --out synth/
roboqc-data export --manifest manifest_dir/manifest.json --format coco --out coco.json
roboqc-data velm --image file:///station/cap.png                    # pixel-expert + VLM classify
roboqc-data logic-qa --ref <ref1> --ref <ref2> --test <test>        # logical-anomaly checklist
roboqc-data deploy-render --template src/roboqc_data/deploy/triton_inference_server.yaml --out rendered/
```

## Defect taxonomy

See `src/roboqc_data/schema/taxonomy.py` — `DefectClass` enum covers the wedge classes from `RomeoFlexVision/docs/pitch-deck.md` slide 6: screw / cable / connector / latch / routing / leak (11 pixel-level classes + OK).

## Reproducibility

Every emitted `Manifest` carries a `manifest_sha256` over its records' content hashes. The CLI accepts a `--seed` flag wired into numpy/random/albumentations.

## Future extraction

To move this package into its own repo:

```bash
git subtree split --prefix=roboqc_data -b roboqc-data-standalone
# then push that branch to the new repo
```
