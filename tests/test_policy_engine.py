from rhaef_v2.core.model_router import TaskCategory
from rhaef_v2.core.policies import FrictionPolicyEngine, FrictionPolicyInput, PolicyAction, PolicyCode


def test_policy_blocks_critical_category():
    engine = FrictionPolicyEngine()
    decision = engine.evaluate(FrictionPolicyInput(category=TaskCategory.CODING))
    assert decision.action == PolicyAction.REQUIRE_HUMAN
    assert decision.code == PolicyCode.CRITICAL_CATEGORY


def test_policy_allows_routine_low_risk():
    engine = FrictionPolicyEngine()
    decision = engine.evaluate(FrictionPolicyInput(category=TaskCategory.ROUTINE))
    assert decision.action == PolicyAction.ALLOW
    assert decision.code == PolicyCode.POLICY_OK
