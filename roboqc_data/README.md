# roboqc_data

RoboQC dataset preparation subpackage. Lives inside the RomeoFlexVision monorepo but is logically standalone — has its own `pyproject.toml`, CI job, and is intended to be split out into a dedicated repository via `git subtree split` once GitHub scope allows.

## What it does

- **Ingest** public industrial-defect benchmarks (**MVTec AD 2** — the 2026 successor with 8 harder scenarios, MVTec AD, MVTec LOCO, VisA, ISP-AD, PKU-PCB) into a canonical Pydantic-v2 manifest.
- **Synthesise** defects via the `brigada` multi-agent pipeline described in `RomeoFlexVision/docs/brigada-architecture.md` (LLM agents plan → deterministic OpenCV/Albumentations layer executes).
- **Label-assist** with SAM 3 / SAM 3.1 (bootstrap-only). SAM 3 (Meta, Nov 2025) replaces the older Grounding-DINO → SAM 2 chain: a single text prompt like "missing screw" yields bbox + mask + confidence in one forward pass. See `src/roboqc_data/label_assist/sam3.py`. A deterministic `StubGroundedSAM2Backend` is the CI fallback when `sam3` is not installed.
- **Train** adapters for Anomalib v2 (PatchCore/EfficientAD), Ultralytics YOLO26 (Jan 2026, NMS-free; YOLO11 / YOLOv8 selectable via `weights=…`), and RT-DETR (default Ultralytics RTDETR; RT-DETRv4 / RT-DETRv3 / RT-DETRv2 plug in via `weights=…`).
- **Export** trained models to ONNX and TensorRT for edge deployment (NVIDIA DeepStream 9.0 + TAO Toolkit 6.26.3 are the canonical downstream runtime; see `RomeoFlexVision/docs/brigada-architecture.md`).

## Install

```bash
pip install -e .[cv,brigada]                  # core dev surface (schema + ingest + brigada stubs)
pip install -e .[cv,brigada,label_assist]     # add SAM 3 label-assist (needs CUDA + weights)
pip install -e .[cv,brigada,train]            # add training adapters (heavy)
pip install -e .[cv,brigada,train,export]     # add ONNX/TensorRT export
```

## CLI

```bash
roboqc-data ingest mvtec_ad --root <path> --out manifest.jsonl
roboqc-data synth --target SCREW_MISSING --count 3 --clean <image>
roboqc-data export --manifest manifest.jsonl --format coco --out coco.json
```

## Defect taxonomy

See `src/roboqc_data/schema/taxonomy.py` — `DefectClass` enum covers the wedge classes from `RomeoFlexVision/docs/pitch-deck.md` slide 6: screw / cable / connector / latch / routing / leak.

## Reproducibility

Every emitted `Manifest` carries a `manifest_sha256` over its records' content hashes. The CLI accepts a `--seed` flag wired into numpy/random/albumentations.

## Future extraction

To move this package into its own repo:

```bash
git subtree split --prefix=roboqc_data -b roboqc-data-standalone
# then push that branch to the new repo
```
