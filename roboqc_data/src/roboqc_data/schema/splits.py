"""Train/val/test split specification."""

from __future__ import annotations

import hashlib
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

Split = Literal["train", "val", "test"]


class SplitSpec(BaseModel):
    """Fractional split spec — fractions must sum to 1.0.

    Splits are assigned deterministically from a stable hash of the
    record id + ``seed`` so the same input always produces the same
    split.
    """

    model_config = ConfigDict(strict=True, frozen=True)

    train: float = Field(default=0.8, ge=0.0, le=1.0)
    val: float = Field(default=0.1, ge=0.0, le=1.0)
    test: float = Field(default=0.1, ge=0.0, le=1.0)
    seed: int = 0

    @model_validator(mode="after")
    def _sums_to_one(self) -> SplitSpec:
        total = self.train + self.val + self.test
        if abs(total - 1.0) > 1e-6:
            raise ValueError(f"SplitSpec fractions must sum to 1.0, got {total}")
        return self

    def assign(self, record_id: str) -> Split:
        """Deterministically assign a record to a split."""
        h = hashlib.sha256(f"{self.seed}:{record_id}".encode()).digest()
        bucket = int.from_bytes(h[:8], "big") / 2**64
        if bucket < self.train:
            return "train"
        if bucket < self.train + self.val:
            return "val"
        return "test"
