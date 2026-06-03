"""Anomalib FolderDataset layout export.

Anomalib's ``Folder`` data module expects::

    <root>/normal/<image>
    <root>/abnormal/<image>
    <root>/ground_truth/<image>  (optional masks for abnormal)

We do not copy image bytes — only write pointer files containing the
canonical URI, mirroring :mod:`roboqc_data.export.yolo_seg`. Downstream
trainers swap in real symlinks/copies if needed.
"""

from __future__ import annotations

from pathlib import Path

from ..schema.records import Manifest
from ..schema.taxonomy import DefectClass


def manifest_to_anomalib_folder(manifest: Manifest, out_dir: Path) -> Path:
    normal = out_dir / "normal"
    abnormal = out_dir / "abnormal"
    masks = out_dir / "ground_truth"
    for d in (normal, abnormal, masks):
        d.mkdir(parents=True, exist_ok=True)

    counts = {"normal": 0, "abnormal": 0, "masks": 0}
    for record in manifest.records:
        safe_id = record.record_id.replace("/", "__")
        is_normal = not record.annotations or all(ann.defect_class is DefectClass.OK for ann in record.annotations)
        target = normal if is_normal else abnormal
        (target / f"{safe_id}.uri").write_text(record.uri, encoding="utf-8")
        counts["normal" if is_normal else "abnormal"] += 1

        if not is_normal:
            mask_ann = next(
                (a for a in record.annotations if a.mask is not None),
                None,
            )
            if mask_ann is not None and mask_ann.mask is not None:
                (masks / f"{safe_id}.uri").write_text(mask_ann.mask.uri, encoding="utf-8")
                counts["masks"] += 1

    summary = out_dir / "summary.txt"
    summary.write_text(
        "\n".join(f"{k}={v}" for k, v in counts.items()) + "\n",
        encoding="utf-8",
    )
    return out_dir
