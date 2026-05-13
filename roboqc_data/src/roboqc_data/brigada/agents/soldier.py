"""Soldier agent: cheap final validation of synthesised metadata."""

from __future__ import annotations

from ..hierarchy import ToolCall, ValidationOutcome


class HeuristicSoldier:
    async def validate(self, tool_call: ToolCall, mask_pixels: int) -> ValidationOutcome:
        if mask_pixels <= 0:
            return ValidationOutcome(valid=False, notes="empty mask")
        return ValidationOutcome(valid=True, notes=f"mask_pixels={mask_pixels}")
