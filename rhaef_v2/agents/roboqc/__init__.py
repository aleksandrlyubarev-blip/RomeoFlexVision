"""Experimental inspection LangGraph supervisor.

The package path retains the legacy ``roboqc`` implementation codename.

6-этапный pipeline: vision_perception → scene_understanding → reasoning_planner
→ roboqc_specialist → action_command → critic_verifier (с возвратом в planner при retry).
Реализация опирается на :class:`rhaef_v2.core.model_router.ModelRouter` для выбора
модели (в том числе локальных SGLang-эндпоинтов) и на ``roboqc_data.prompts``
для шаблонов.
"""

from .graph import build_graph, run
from .state import RoboQCState

__all__ = ["RoboQCState", "build_graph", "run"]
