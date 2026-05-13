import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))


@pytest.fixture(autouse=True)
def _stub_litellm_cost(monkeypatch):
    """Make ``litellm.completion_cost`` return 0.0 for all tests.

    Newer litellm versions require a fully populated response object;
    our hand-rolled FakeResponse used across the rhaef_v2 suite cannot
    provide every field litellm now inspects. The router treats cost
    tracking as best-effort metadata, so a zero stub is correct for
    test purposes and removes the previously-known upstream-induced
    failures in test_api_routes and test_model_router.
    """
    import litellm

    monkeypatch.setattr(litellm, "completion_cost", lambda **_: 0.0)
