"""Export a label-assist proposal set as a human-review JSONL queue.

Reviewers consume this file in the QC engineer console (Romeo_PHD).
Each line is one :class:`roboqc_data.schema.records.ImageRecord`
serialised as JSON with provenance="grounded_sam2".
"""

from __future__ import annotations

from pathlib import Path
from typing import Sequence

from ..schema.records import ImageRecord


def write_review_queue(records: Sequence[ImageRecord], out_path: Path) -> Path:
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", encoding="utf-8") as fh:
        for record in records:
            fh.write(record.model_dump_json())
            fh.write("\n")
    return out_path
