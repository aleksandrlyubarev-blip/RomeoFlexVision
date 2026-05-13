# roboqc_data

RoboQC dataset preparation subpackage. Lives inside the RomeoFlexVision monorepo but is logically standalone — has its own `pyproject.toml`, CI job, and is intended to be split out into a dedicated repository via `git subtree split` once GitHub scope allows.

## What it does

- **Ingest** public industrial-defect benchmarks (MVTec AD, MVTec LOCO, VisA, ISP-AD, PKU-PCB) into a canonical Pydantic-v2 manifest.
- **Synthesise** defects via the `brigada` multi-agent pipeline described in `RomeoFlexVision/docs/brigada-architecture.md` (LLM agents plan → deterministic OpenCV/Albumentations layer executes).
- **Label-assist** with Grounded SAM 2 (bootstrap-only).
- **Train** adapters for Anomalib (PatchCore/EfficientAD), Ultralytics YOLO (det+seg), and RT-DETR.
- **Export** trained models to ONNX and TensorRT for edge deployment.

## Install

```bash
pip install -e .[cv,brigada]          # core dev surface (schema + ingest + brigada stubs)
pip install -e .[cv,brigada,train]    # add training adapters (heavy)
pip install -e .[cv,brigada,train,export]  # add ONNX/TensorRT export
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
