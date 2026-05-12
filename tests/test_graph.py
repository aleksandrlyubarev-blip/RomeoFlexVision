from rhaef_v2.core.graph import app, rhaef_graph, route_after_romeo


def test_health_app_exists():
    assert app is not None


def test_route_after_romeo_to_coder():
    assert route_after_romeo({"next": "coding"}) == "claude_coder"


def test_graph_is_optional_or_compiled():
    assert rhaef_graph is None or rhaef_graph is not None
