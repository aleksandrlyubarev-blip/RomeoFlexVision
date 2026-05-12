from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Protocol


class EdgeCaptureProvider(Protocol):
    def capture_frame(self, camera_id: str) -> dict: ...


class EdgeInferenceProvider(Protocol):
    def run_inference(self, frame_ref: str, model_profile: str = "default") -> dict: ...


@dataclass
class JetsonNanoCaptureAdapter:
    node_id: str = "jetson-nano"

    def capture_frame(self, camera_id: str) -> dict:
        return {
            "node": self.node_id,
            "camera_id": camera_id,
            "frame_ref": f"nano://{camera_id}/{datetime.now(timezone.utc).timestamp()}",
            "status": "captured",
        }


@dataclass
class JetsonOrinInferenceAdapter:
    node_id: str = "jetson-orin-64gb"

    def run_inference(self, frame_ref: str, model_profile: str = "default") -> dict:
        return {
            "node": self.node_id,
            "frame_ref": frame_ref,
            "model_profile": model_profile,
            "decision": "draft_pending_human_approval",
            "status": "inference_complete",
        }
