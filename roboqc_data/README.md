# roboqc_data

Experimental dataset tooling for public datasets and synthetic visual
inspection examples.

The package supports:

- ingest adapters for public datasets
- synthetic defect generation
- dataset manifests and license tracking
- COCO, YOLO segmentation, and Anomalib-folder exports

The package name is an implementation codename. Public-facing software is
called **Neuron Vision Display**. **RoboQC** refers to robot hardware.

## Install

```bash
pip install -e .[cv,brigada]
```

## CLI

```bash
roboqc-data ingest mvtec_ad --root <path> --out manifest.jsonl
roboqc-data synth --target SCREW_MISSING --count 3 --clean <image>
roboqc-data export --manifest manifest.jsonl --format coco --out coco.json
```
