from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Optional
from uuid import uuid4

try:
    from fastapi import APIRouter
except Exception:  # pragma: no cover
    class APIRouter:  # type: ignore
        def post(self, *_: object, **__: object):
            def decorator(func):
                return func
            return decorator

        def get(self, *_: object, **__: object):
            def decorator(func):
                return func
            return decorator

try:
    from pydantic import BaseModel, ConfigDict
except Exception:  # pragma: no cover
    class BaseModel:  # type: ignore
        def __init__(self, **data: Any) -> None:
            for key, value in data.items():
                setattr(self, key, value)

    def ConfigDict(**_: Any) -> dict[str, Any]:  # type: ignore
        return {}

from rhaef_v2.core.model_router import ModelRouter
from rhaef_v2.core.policies import FrictionPolicyEngine, FrictionPolicyInput, PolicyAction
from rhaef_v2.schemas.api import APIError, RunRequest, RunResponse, StatsResponse
from rhaef_v2.tools.interfaces import (
    InspectionRequest,
    InspectionResult,
    StubRoboQCClient,
)


class _FakeResponse:
    choices = [type("Choice", (), {"message": {"role": "assistant", "content": "ok"}})()]


def _fake_completion_client(**_: Any) -> _FakeResponse:
    return _FakeResponse()


class APIServices(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    model_router: ModelRouter
    policy_engine: FrictionPolicyEngine
    # roboqc_client is duck-typed (Protocol RoboQCClient); Pydantic can't build an
    # isinstance validator for a Protocol so we type it as Any here.
    roboqc_client: Optional[Any] = None
    dataset_root: Optional[Path] = None


class DatasetSummary(BaseModel):
    model_config = ConfigDict(strict=True)
    manifest_id: str
    manifest_sha256: str
    taxonomy_version: str
    record_count: int
    license_breakdown: dict[str, int]
    class_breakdown: dict[str, int]


class SynthPreviewRequest(BaseModel):
    model_config = ConfigDict(strict=True)
    target_class: str
    count: int = 1
    seed: int = 0


class SynthPreviewResponse(BaseModel):
    model_config = ConfigDict(strict=True)
    target_class: str
    count: int
    seed: int
    manifest_id: str
    record_ids: list[str]


async def execute_run(payload: RunRequest, services: APIServices) -> RunResponse | APIError:
    if not payload.messages:
        return APIError(code="EMPTY_MESSAGES", message="messages must not be empty", request_id=payload.request_id)

    decision = services.policy_engine.evaluate(
        FrictionPolicyInput(
            category=payload.category,
            estimated_cost_usd=payload.estimated_cost_usd,
            environment=payload.environment,
            risk_level=payload.risk_level,
        )
    )
    if decision.action == PolicyAction.REQUIRE_HUMAN:
        return RunResponse(
            request_id=payload.request_id,
            status="blocked",
            decision=decision.action.value,
            reason=decision.reason,
            policy_code=decision.code.value,
        )

    response = await services.model_router.route(category=payload.category, messages=payload.messages)
    output = response.choices[0].message["content"]
    return RunResponse(
        request_id=payload.request_id,
        status="ok",
        decision=decision.action.value,
        reason=decision.reason,
        policy_code=decision.code.value,
        output=output,
    )


def build_stats(services: APIServices) -> StatsResponse:
    data = services.model_router.get_stats()
    return StatsResponse(request_id=str(uuid4()), **data)


def build_dataset_summary(manifest_dir: Path) -> DatasetSummary | APIError:
    manifest_path = manifest_dir / "manifest.json"
    records_path = manifest_dir / "records.jsonl"
    if not manifest_path.is_file():
        return APIError(code="MANIFEST_NOT_FOUND", message=str(manifest_path), request_id=manifest_dir.name)
    header = json.loads(manifest_path.read_text())
    license_counts: dict[str, int] = {}
    class_counts: dict[str, int] = {}
    record_count = 0
    if records_path.is_file():
        for line in records_path.read_text().splitlines():
            if not line.strip():
                continue
            record = json.loads(line)
            record_count += 1
            license_counts[record["source"]["license"]] = (
                license_counts.get(record["source"]["license"], 0) + 1
            )
            for ann in record.get("annotations", []):
                cls = ann["defect_class"]
                class_counts[cls] = class_counts.get(cls, 0) + 1
    return DatasetSummary(
        manifest_id=header["manifest_id"],
        manifest_sha256=header["manifest_sha256"],
        taxonomy_version=header.get("taxonomy_version", ""),
        record_count=record_count,
        license_breakdown=license_counts,
        class_breakdown=class_counts,
    )


def build_synth_preview(payload: SynthPreviewRequest) -> SynthPreviewResponse:
    """Return a dry-run preview describing what brigada *would* synthesise.

    This does not write artifacts to disk — it just enumerates the
    deterministic record ids so callers can validate a request before
    spending compute on it.
    """
    record_ids = [
        f"brigada/{payload.target_class}/{payload.seed:08d}_{idx:04d}"
        for idx in range(payload.count)
    ]
    return SynthPreviewResponse(
        target_class=payload.target_class,
        count=payload.count,
        seed=payload.seed,
        manifest_id=f"brigada-{payload.target_class}-{payload.seed}",
        record_ids=record_ids,
    )


async def run_inspection(payload: InspectionRequest, services: APIServices) -> InspectionResult:
    client = services.roboqc_client or StubRoboQCClient()
    return await client.run_check(payload)


def create_api_router(services: APIServices | None = None) -> APIRouter:
    svc = services or APIServices(
        model_router=ModelRouter(client=_fake_completion_client),
        policy_engine=FrictionPolicyEngine(),
    )
    router = APIRouter()

    @router.post("/run", response_model=RunResponse)
    async def run_route(payload: RunRequest) -> RunResponse | APIError:
        return await execute_run(payload, svc)

    @router.get("/stats")
    async def stats() -> StatsResponse:
        return build_stats(svc)

    @router.get("/dataset/manifest/{manifest_id}")
    def dataset_manifest(manifest_id: str) -> DatasetSummary | APIError:
        root = svc.dataset_root or Path("/data/roboqc")
        return build_dataset_summary(root / manifest_id)

    @router.post("/dataset/synth/preview", response_model=SynthPreviewResponse)
    def dataset_synth_preview(payload: SynthPreviewRequest) -> SynthPreviewResponse:
        return build_synth_preview(payload)

    @router.post("/inspect", response_model=InspectionResult)
    async def inspect(payload: InspectionRequest) -> InspectionResult:
        return await run_inspection(payload, svc)

    return router


router = create_api_router()
