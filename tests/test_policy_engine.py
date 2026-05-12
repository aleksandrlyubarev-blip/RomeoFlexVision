from rhaef_v2.core.model_router import TaskCategory
from rhaef_v2.core.policies import FrictionPolicyEngine, FrictionPolicyInput, PolicyAction, PolicyCode
from rhaef_v2.core.settings import RuntimeSettings


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


def test_policy_profile_threshold_prod():
    settings = RuntimeSettings(policy_profile="prod", prod_high_cost_threshold=1.0)
    engine = FrictionPolicyEngine(settings=settings)
    decision = engine.evaluate(FrictionPolicyInput(category=TaskCategory.ROUTINE, estimated_cost_usd=1.2))
    assert decision.code == PolicyCode.HIGH_COST_PROFILE
