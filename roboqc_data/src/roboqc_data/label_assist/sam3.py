"""SAM 3 / SAM 3.1 label-assist backend.

Meta released SAM 3 in November 2025 (arXiv:2511.16719); the SAM 3.1
"Object Multiplex" follow-up landed in March 2026 and is a drop-in
replacement. SAM 3 folds open-vocabulary detection and segmentation
into one model, which is exactly what we need for industrial defect
label-assist: a single text prompt like "missing screw" or "bent pin"
produces a mask + bbox + confidence in one forward pass.

This module integrates the model behind a Protocol so the rest of the
pipeline stays unchanged. The actual ``sam3`` package is optional; if
it's not installed (or model weights are not on disk),
:class:`Sam3Backend` raises at construction time and
:class:`roboqc_data.label_assist.grounded_sam2._default_backend`
falls back to the deterministic stub used by CI.

References:
- Paper: https://arxiv.org/abs/2511.16719
- Code:  https://github.com/facebookresearch/sam3
- SAM 3.1 (2026 update): https://ai.meta.com/blog/segment-anything-model-3/
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

from ..schema.records import BBox, MaskRef, Provenance
from .grounded_sam2 import LabelPrompt, Proposal

DEFAULT_CHECKPOINT = "sam3_base"
DEFAULT_DEVICE = "cuda"


class Sam3Backend:
    """SAM 3 / SAM 3.1 backed open-vocabulary label-assist.

    Args:
        checkpoint: SAM 3 checkpoint id or path. Default ``"sam3_base"``.
        device: torch device string. Default ``"cuda"``.
        score_threshold: per-instance confidence cutoff. The model
            emits a presence token plus per-mask confidence; we keep
            anything above this floor.

    Raises:
        RuntimeError: if the ``sam3`` package is not importable. Use
            :class:`StubGroundedSAM2Backend` for offline / CI flows.

    Example:
        >>> # backend = Sam3Backend(checkpoint="sam3_base", device="cuda")
        >>> # LabelAssistant(backend=backend).propose(images_dir, prompts)
    """

    name = "sam3"
    provenance: Provenance = "sam3"

    def __init__(
        self,
        checkpoint: str = DEFAULT_CHECKPOINT,
        device: str = DEFAULT_DEVICE,
        score_threshold: float = 0.4,
    ) -> None:
        if not 0.0 <= score_threshold <= 1.0:
            raise ValueError("score_threshold must be in [0,1]")
        try:
            from sam3 import build_sam3_predictor  # type: ignore
        except Exception as exc:  # pragma: no cover - exercised when sam3 is missing
            raise RuntimeError("sam3 package is not installed; install with the [label_assist] extra") from exc
        self._predictor = build_sam3_predictor(checkpoint=checkpoint, device=device)
        self.score_threshold = score_threshold

    def detect(self, image_path: Path, prompt: LabelPrompt) -> list[Proposal]:  # pragma: no cover
        import numpy as np
        from PIL import Image

        with Image.open(image_path) as im:
            rgb = np.asarray(im.convert("RGB"))
        height, width = rgb.shape[:2]
        outputs: list[dict[str, Any]] = self._predictor.predict_concept(
            image=rgb,
            text_prompt=prompt.text,
            score_threshold=max(self.score_threshold, prompt.box_threshold),
        )
        return [_to_proposal(item, width, height) for item in outputs if _is_valid(item)]


def _is_valid(item: dict[str, Any]) -> bool:  # pragma: no cover
    return "bbox" in item and "score" in item


def _to_proposal(item: dict[str, Any], width: int, height: int) -> Proposal:  # pragma: no cover
    x1, y1, x2, y2 = item["bbox"]
    bbox = BBox(
        x=max(0.0, min(x1, x2) / width),
        y=max(0.0, min(y1, y2) / height),
        w=max(1.0, abs(x2 - x1)) / width,
        h=max(1.0, abs(y2 - y1)) / height,
        image_w=width,
        image_h=height,
    )
    mask = _mask_ref(item.get("mask_uri"), item.get("mask_sha256"))
    return Proposal(bbox=bbox, mask=mask, confidence=float(item["score"]))


def _mask_ref(uri: str | None, sha256: str | None) -> MaskRef | None:  # pragma: no cover
    if not uri or not sha256:
        return None
    return MaskRef(uri=uri, sha256=sha256, encoding="png_binary")
