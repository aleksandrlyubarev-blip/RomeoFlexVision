from rhaef_v2.core.settings import RuntimeSettings
from rhaef_v2.tools.vision_factory import create_vision_provider
from rhaef_v2.tools.vision_providers import LocalVisionProvider, RoboflowMCPProvider


def test_create_local_vision_provider_default():
    provider = create_vision_provider(RuntimeSettings())
    assert isinstance(provider, LocalVisionProvider)


def test_create_roboflow_provider_when_configured():
    provider = create_vision_provider(RuntimeSettings(vision_provider="roboflow_mcp"))
    assert isinstance(provider, RoboflowMCPProvider)
