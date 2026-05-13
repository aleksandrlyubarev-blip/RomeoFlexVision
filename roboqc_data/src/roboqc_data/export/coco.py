"""COCO-format export from a canonical Manifest."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from ..schema.records import Manifest
from ..schema.taxonomy import DefectClass


def manifest_to_coco(manifest: Manifest) -> dict[str, Any]:
    """Convert a Manifest to a COCO-detection-style dict.

    Categories are enumerated from :class:`DefectClass` (skipping OK).
    Records without annotations are still written as images so OK
    splits remain visible to consumers.
    """
    categories = [
        {"id": idx + 1, "name": cls.value}
        for idx, cls in enumerate(c for c in DefectClass if c is not DefectClass.OK)
    ]
    cat_id = {entry["name"]: entry["id"] for entry in categories}

    images: list[dict[str, Any]] = []
    annotations: list[dict[str, Any]] = []
    next_ann_id = 1

    for image_id, record in enumerate(manifest.records, start=1):
        images.append(
            {
                "id": image_id,
                "file_name": record.uri,
                "width": record.width,
                "height": record.height,
                "license": record.source.license,
                "split": record.split,
            }
        )
        for ann in record.annotations:
            if ann.bbox is None:
                continue
            w_abs = ann.bbox.w * ann.bbox.image_w
            h_abs = ann.bbox.h * ann.bbox.image_h
            annotations.append(
                {
                    "id": next_ann_id,
                    "image_id": image_id,
                    "category_id": cat_id[ann.defect_class.value],
                    "bbox": [
                        ann.bbox.x * ann.bbox.image_w,
                        ann.bbox.y * ann.bbox.image_h,
                        w_abs,
                        h_abs,
                    ],
                    "area": w_abs * h_abs,
                    "iscrowd": 0,
                    "provenance": ann.provenance,
                }
            )
            next_ann_id += 1

    return {
        "info": {
            "manifest_id": manifest.manifest_id,
            "manifest_sha256": manifest.manifest_sha256,
            "taxonomy_version": manifest.taxonomy_version,
        },
        "licenses": [],
        "images": images,
        "annotations": annotations,
        "categories": categories,
    }


def write_coco(manifest: Manifest, out_path: Path) -> Path:
    """Serialise ``manifest_to_coco`` to ``out_path``."""
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(manifest_to_coco(manifest), indent=2), encoding="utf-8")
    return out_path
