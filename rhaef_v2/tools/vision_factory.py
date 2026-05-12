from __future__ import annotations

from rhaef_v2.core.settings import RuntimeSettings
from rhaef_v2.tools.vision_providers import LocalVisionProvider, RoboflowMCPProvider, VisionDataProvider


def create_vision_provider(settings: RuntimeSettings) -> VisionDataProvider:
    if settings.vision_provider == "roboflow_mcp":
        return RoboflowMCPProvider()
    return LocalVisionProvider()
