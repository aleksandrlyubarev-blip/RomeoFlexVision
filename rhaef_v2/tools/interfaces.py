from __future__ import annotations

from typing import Any, Optional, Protocol

try:
    from pydantic import BaseModel, ConfigDict, Field
except Exception:  # pragma: no cover
    class BaseModel:  # type: ignore
        def __init__(self, **data: Any) -> None:
            for key, value in data.items():
                setattr(self, key, value)

    def ConfigDict(**_: Any) -> dict[str, Any]:  # type: ignore
        return {}

    def Field(default: Any = None, **_: Any) -> Any:  # type: ignore
        return default


class DetectedDefect(BaseModel):
    model_config = ConfigDict(strict=True, frozen=True)

    defect_class: str
    bbox: Optional[tuple[float, float, float, float]] = None
    mask_uri: Optional[str] = None
    confidence: float = Field(ge=0.0, le=1.0)


class InspectionRequest(BaseModel):
    model_config = ConfigDict(strict=True)

    inspection_id: str
    image_uri: str
    station_id: Optional[str] = None
    sop_id: Optional[str] = None


class InspectionResult(BaseModel):
    model_config = ConfigDict(strict=True, frozen=True)

    inspection_id: str
    image_uri: str
    defects: tuple[DetectedDefect, ...] = ()
    overall_pass: bool
    confidence: float = Field(ge=0.0, le=1.0)
    model_version: str
    requires_hitl: bool = False


class RoboQCClient(Protocol):
    async def run_check(self, payload: InspectionRequest) -> InspectionResult: ...


class HardwareBridgeClient(Protocol):
    async def execute(self, command: str) -> str: ...


class StubRoboQCClient:
    """Deterministic stub used until a real inference service is wired in."""

    model_version: str = "stub-0.1.0"

    async def run_check(self, payload: InspectionRequest) -> InspectionResult:
        defects = (
            DetectedDefect(defect_class="ok", confidence=0.95),
        )
        return InspectionResult(
            inspection_id=payload.inspection_id,
            image_uri=payload.image_uri,
            defects=defects,
            overall_pass=True,
            confidence=0.95,
            model_version=self.model_version,
            requires_hitl=False,
        )


# Back-compat alias for one release. Existing callers and tests
# constructed ``MockRoboQCClient``; the new payload-typed client is
# strictly richer.
MockRoboQCClient = StubRoboQCClient


class MockHardwareBridgeClient:
    async def execute(self, command: str) -> str:
        return f"hardware-ok:{command}"
