"""Brigada synthesizer: glues the agent hierarchy and the CV layer.

This implements the General → Major → Sergeant → Soldier loop with
heuristic stand-ins for the LLM agents. Swapping in router-backed
agents (via ``rhaef_v2.core.model_router.ModelRouter``) is a drop-in
change because every role is a Protocol.

A FrictionGate from ``rhaef_v2.core.model_router`` guards high-risk
defect classes (LEAK, WRONG_ROUTING) and large batches — required by
CODING_STANDARDS clause 6.
"""

from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import numpy as np
from PIL import Image
from pydantic import BaseModel, ConfigDict, Field

from ..schema.hashing import manifest_digest, sha256_file
from ..schema.records import (
    Annotation,
    BBox,
    ImageRecord,
    Manifest,
    MaskRef,
    SourceInfo,
)
from ..schema.splits import SplitSpec
from ..schema.taxonomy import TAXONOMY_VERSION, DefectClass
from .agents.general import HeuristicGeneral
from .agents.major import HeuristicMajor
from .agents.sergeant import HeuristicSergeant
from .agents.soldier import HeuristicSoldier
from .cv_layer.registry import get_transform
from .hierarchy import (
    GeneralAgent,
    MajorAgent,
    SergeantAgent,
    SoldierAgent,
    ToolCall,
)

try:
    from rhaef_v2.core.model_router import FrictionGate
except Exception:  # pragma: no cover
    FrictionGate = None  # type: ignore[assignment]

HIGH_RISK_CLASSES: frozenset[DefectClass] = frozenset(
    {DefectClass.LEAK, DefectClass.WRONG_ROUTING}
)
FRICTION_COUNT_THRESHOLD = 100


class SynthRequest(BaseModel):
    model_config = ConfigDict(strict=True)
    clean_image_path: Path
    target_class: DefectClass
    count: int = Field(default=1, ge=1, le=1000)
    seed: int = 0
    output_dir: Path


class SynthArtifact(BaseModel):
    model_config = ConfigDict(strict=True, frozen=True)
    image_path: Path
    mask_path: Path
    tool_call: ToolCall


class SynthResult(BaseModel):
    model_config = ConfigDict(strict=True)
    manifest: Manifest
    artifacts: tuple[SynthArtifact, ...]


class BrigadaSynthesizer:
    """Orchestrates one synthetic-generation batch.

    Args:
        general: agent that plans the batch strategy.
        major: agent that refines into per-class subplans.
        sergeant: agent that picks numeric transform params.
        soldier: agent that validates per-sample output.
        friction: optional :class:`rhaef_v2.core.model_router.FrictionGate`
            for high-risk classes and large batches. When ``None`` the
            gate is skipped (suitable for tests and the flat-mode
            described in the brigada doc).
    """

    def __init__(
        self,
        general: Optional[GeneralAgent] = None,
        major: Optional[MajorAgent] = None,
        sergeant: Optional[SergeantAgent] = None,
        soldier: Optional[SoldierAgent] = None,
        friction: Optional[object] = None,
    ) -> None:
        self.general = general or HeuristicGeneral()
        self.major = major or HeuristicMajor()
        self.sergeant = sergeant or HeuristicSergeant()
        self.soldier = soldier or HeuristicSoldier()
        self.friction = friction

    async def generate(self, request: SynthRequest) -> SynthResult:
        self._maybe_friction(request)
        plan = await self.general.plan(request.target_class, request.count)
        sub_plan = await self.major.refine(plan, request.target_class, request.count)
        tool_call = await self.sergeant.parameterize(sub_plan)
        transform = get_transform(request.target_class)

        request.output_dir.mkdir(parents=True, exist_ok=True)
        clean = np.asarray(Image.open(request.clean_image_path).convert("RGB"))
        rng = np.random.default_rng(request.seed)
        spec = SplitSpec(seed=request.seed)

        records: list[ImageRecord] = []
        artifacts: list[SynthArtifact] = []
        for idx in range(request.count):
            rgb, mask = transform.apply(clean, tool_call.params, rng)
            outcome = await self.soldier.validate(tool_call, int((mask > 0).sum()))
            if not outcome.valid:
                continue
            record, artifact = self._persist(
                request, tool_call, rgb, mask, idx, spec
            )
            records.append(record)
            artifacts.append(artifact)

        manifest = Manifest(
            manifest_id=f"brigada-{request.target_class.value}-{request.seed}",
            created_at=datetime.now(tz=timezone.utc),
            seed=request.seed,
            taxonomy_version=TAXONOMY_VERSION,
            manifest_sha256=manifest_digest((r.record_id, r.sha256) for r in records),
            records=tuple(records),
        )
        return SynthResult(manifest=manifest, artifacts=tuple(artifacts))

    def _maybe_friction(self, request: SynthRequest) -> None:
        if self.friction is None or FrictionGate is None:
            return
        if request.target_class in HIGH_RISK_CLASSES or request.count >= FRICTION_COUNT_THRESHOLD:
            gate = FrictionGate.critical(
                f"Brigada synthesising {request.count} samples of {request.target_class.value}"
            )
            self.friction(gate)

    def _persist(
        self,
        request: SynthRequest,
        tool_call: ToolCall,
        rgb: np.ndarray,
        mask: np.ndarray,
        idx: int,
        spec: SplitSpec,
    ) -> tuple[ImageRecord, SynthArtifact]:
        record_id = f"brigada/{request.target_class.value}/{request.seed:08d}_{idx:04d}"
        image_path = request.output_dir / f"{idx:04d}.png"
        mask_path = request.output_dir / f"{idx:04d}_mask.png"
        Image.fromarray(rgb).save(image_path)
        Image.fromarray(mask).save(mask_path)
        height, width = rgb.shape[:2]

        annotation = Annotation(
            id=f"{record_id}#0",
            defect_class=request.target_class,
            bbox=BBox(x=0.0, y=0.0, w=1.0, h=1.0, image_w=width, image_h=height),
            mask=MaskRef(
                uri=mask_path.resolve().as_uri(),
                sha256=sha256_file(mask_path),
                encoding="png_binary",
            ),
            confidence=1.0,
            provenance="brigada",
        )
        record = ImageRecord(
            record_id=record_id,
            uri=image_path.resolve().as_uri(),
            sha256=sha256_file(image_path),
            width=width,
            height=height,
            split=spec.assign(record_id),
            source=SourceInfo(
                dataset="brigada",
                license="internal",
                attribution="brigada",
                original_id=str(request.clean_image_path),
            ),
            annotations=(annotation,),
            tags=(f"transform_params:{tool_call.params}",),
        )
        return record, SynthArtifact(image_path=image_path, mask_path=mask_path, tool_call=tool_call)
