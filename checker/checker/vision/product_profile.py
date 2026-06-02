"""Product profile schema: reference image plus normalized ROI definitions."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

RoiKind = Literal["generic", "screw", "component", "connector", "edge", "damage_zone"]


class RoiSpec(BaseModel):
    """A rectangular region of interest in normalized reference-image coordinates."""

    model_config = ConfigDict(strict=True, frozen=True)

    roi_id: str = Field(min_length=1)
    label: str = Field(min_length=1)
    kind: RoiKind = "generic"
    x: float = Field(ge=0.0, le=1.0)
    y: float = Field(ge=0.0, le=1.0)
    width: float = Field(gt=0.0, le=1.0)
    height: float = Field(gt=0.0, le=1.0)
    expected: str = ""

    @model_validator(mode="after")
    def _fits_unit_square(self) -> "RoiSpec":
        if self.x + self.width > 1.0 or self.y + self.height > 1.0:
            raise ValueError("ROI rectangle must fit inside normalized [0, 1] image bounds")
        return self


class ProductProfile(BaseModel):
    """Reference template for one inspected product/SKU."""

    model_config = ConfigDict(strict=True, frozen=True, arbitrary_types_allowed=True)

    product_code: str = Field(min_length=1)
    name: str = Field(min_length=1)
    reference_image_path: Path
    rois: list[RoiSpec] = Field(default_factory=list)
    registration_min_score: float = Field(default=0.25, ge=0.0, le=1.0)

    @field_validator("reference_image_path", mode="before")
    @classmethod
    def _coerce_reference_path(cls, value: object) -> object:
        if isinstance(value, str):
            return Path(value).expanduser()
        return value

    @classmethod
    def load(cls, path: Path) -> "ProductProfile":
        payload = json.loads(path.read_text())
        if isinstance(payload.get("reference_image_path"), str):
            ref = Path(payload["reference_image_path"]).expanduser()
            if not ref.is_absolute():
                payload["reference_image_path"] = path.parent / ref
        return cls(**payload)

    def roi_ids(self) -> set[str]:
        return {roi.roi_id for roi in self.rois}
