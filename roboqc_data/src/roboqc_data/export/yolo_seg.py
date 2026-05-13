"""Ultralytics YOLO segmentation export.

Layout produced::

    <out_dir>/data.yaml
    <out_dir>/<split>/labels/<record_id>.txt
    <out_dir>/<split>/images/<record_id>.<ext>   (only path is written; we do not copy bytes)

Each label line follows YOLO-seg convention::

    <class_idx> <x_center> <y_center> <w> <h> <px1> <py1> <px2> <py2> ...

Polygon points are normalised to [0,1]. If no polygon is available we
fall back to the bbox corners (rectangle).
"""

from __future__ import annotations

from pathlib import Path

import yaml

from ..schema.records import Annotation, ImageRecord, Manifest
from ..schema.taxonomy import DefectClass

CLASSES: list[str] = [c.value for c in DefectClass if c is not DefectClass.OK]
CLASS_INDEX: dict[str, int] = {name: idx for idx, name in enumerate(CLASSES)}


def manifest_to_yolo_seg(manifest: Manifest, out_dir: Path) -> Path:
    out_dir.mkdir(parents=True, exist_ok=True)
    for split in ("train", "val", "test"):
        (out_dir / split / "labels").mkdir(parents=True, exist_ok=True)
        (out_dir / split / "images").mkdir(parents=True, exist_ok=True)

    for record in manifest.records:
        _write_record(record, out_dir)

    data_yaml = {
        "path": str(out_dir.resolve()),
        "train": "train/images",
        "val": "val/images",
        "test": "test/images",
        "names": CLASSES,
        "manifest_sha256": manifest.manifest_sha256,
    }
    yaml_path = out_dir / "data.yaml"
    yaml_path.write_text(yaml.safe_dump(data_yaml, sort_keys=False), encoding="utf-8")
    return yaml_path


def _write_record(record: ImageRecord, out_dir: Path) -> None:
    safe_id = record.record_id.replace("/", "__")
    label_path = out_dir / record.split / "labels" / f"{safe_id}.txt"
    image_pointer = out_dir / record.split / "images" / f"{safe_id}.uri"
    image_pointer.write_text(record.uri, encoding="utf-8")

    if not record.annotations:
        label_path.write_text("", encoding="utf-8")
        return

    lines: list[str] = []
    for ann in record.annotations:
        if ann.defect_class is DefectClass.OK:
            continue
        line = _yolo_line(ann)
        if line is not None:
            lines.append(line)
    label_path.write_text("\n".join(lines), encoding="utf-8")


def _yolo_line(ann: Annotation) -> str | None:
    class_idx = CLASS_INDEX.get(ann.defect_class.value)
    if class_idx is None:
        return None
    if ann.bbox is None:
        return None
    bbox = ann.bbox
    cx = bbox.x + bbox.w / 2
    cy = bbox.y + bbox.h / 2
    head = f"{class_idx} {cx:.6f} {cy:.6f} {bbox.w:.6f} {bbox.h:.6f}"
    if ann.polygon is not None and len(ann.polygon.points) >= 3:
        flat = " ".join(f"{px:.6f} {py:.6f}" for px, py in ann.polygon.points)
    else:
        flat = " ".join(
            f"{px:.6f} {py:.6f}"
            for px, py in (
                (bbox.x, bbox.y),
                (bbox.x + bbox.w, bbox.y),
                (bbox.x + bbox.w, bbox.y + bbox.h),
                (bbox.x, bbox.y + bbox.h),
            )
        )
    return f"{head} {flat}"
