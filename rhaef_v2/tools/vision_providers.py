from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Protocol


class VisionDataProvider(Protocol):
    def create_project(self, name: str) -> dict: ...

    def upload_dataset(self, project_id: str, source_uri: str) -> dict: ...

    def request_training(self, project_id: str, model: str) -> dict: ...


@dataclass
class LocalVisionProvider:
    def create_project(self, name: str) -> dict:
        return {"project_id": f"local-{name}", "status": "created"}

    def upload_dataset(self, project_id: str, source_uri: str) -> dict:
        return {"project_id": project_id, "source_uri": source_uri, "status": "draft_pending_human_approval"}

    def request_training(self, project_id: str, model: str) -> dict:
        return {"project_id": project_id, "model": model, "status": "draft_pending_human_approval"}


@dataclass
class RoboflowMCPProvider:
    endpoint: str = "https://mcp.roboflow.com/mcp"

    def _headers(self) -> dict[str, str]:
        api_key = os.getenv("ROBOFLOW_API_KEY", "")
        return {"x-api-key": api_key, "Accept": "application/json, text/event-stream"}

    def create_project(self, name: str) -> dict:
        return {"provider": "roboflow_mcp", "endpoint": self.endpoint, "name": name, "status": "draft_pending_human_approval"}

    def upload_dataset(self, project_id: str, source_uri: str) -> dict:
        return {"provider": "roboflow_mcp", "project_id": project_id, "source_uri": source_uri, "status": "draft_pending_human_approval"}

    def request_training(self, project_id: str, model: str) -> dict:
        return {"provider": "roboflow_mcp", "project_id": project_id, "model": model, "status": "draft_pending_human_approval"}
